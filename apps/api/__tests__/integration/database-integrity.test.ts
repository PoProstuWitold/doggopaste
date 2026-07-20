// biome-ignore-all lint: test files
import { ok, strictEqual } from 'node:assert'
import test from 'node:test'
import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import {
	foldersTable,
	pastesTable,
	pasteTagsTable,
	tagsTable,
	usersTable
} from '../../src/db/schema.js'
import { prepareDb } from '../test-utils.js'

function postgresCode(error: unknown): string | undefined {
	let current = error
	for (let depth = 0; depth < 4; depth += 1) {
		if (!current || typeof current !== 'object') return undefined
		if ('code' in current && typeof current.code === 'string') {
			return current.code
		}
		current = 'cause' in current ? current.cause : undefined
	}
	return undefined
}

async function expectPostgresError(
	operation: () => Promise<unknown>,
	expectedCode: string
) {
	try {
		await operation()
	} catch (error) {
		strictEqual(postgresCode(error), expectedCode)
		return
	}
	throw new Error(`Expected PostgreSQL error ${expectedCode}`)
}

test(
	'DATABASE INTEGRITY: ownership and uniqueness constraints',
	{ concurrency: false },
	async (t) => {
		await prepareDb()
		const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 12)
		const emails = [
			`db-owner-a-${suffix}@example.test`,
			`db-owner-b-${suffix}@example.test`
		]
		const slugs = [
			`db-folder-${suffix}`,
			`db-cross-${suffix}`,
			`db-private-${suffix}`,
			`db-guest-${suffix}`,
			`db-tag-${suffix}`
		]
		const tagName = `dbtag${suffix.slice(0, 8)}`

		t.after(async () => {
			await db.delete(pastesTable).where(inArray(pastesTable.slug, slugs))
			await db.delete(tagsTable).where(eq(tagsTable.name, tagName))
			await db.delete(usersTable).where(inArray(usersTable.email, emails))
		})

		const [ownerA, ownerB] = await db
			.insert(usersTable)
			.values([
				{
					name: `db-owner-a-${suffix}`,
					email: emails[0]
				},
				{
					name: `db-owner-b-${suffix}`,
					email: emails[1]
				}
			])
			.returning({ id: usersTable.id })

		await t.test(
			'deleting a folder clears folderId without clearing paste owner',
			async () => {
				const [folder] = await db
					.insert(foldersTable)
					.values({
						name: `PasteFolder${suffix}`,
						userId: ownerA.id
					})
					.returning({ id: foldersTable.id })
				const [paste] = await db
					.insert(pastesTable)
					.values({
						title: 'Folder ownership fixture',
						slug: slugs[0],
						content: 'folder ownership content',
						userId: ownerA.id,
						folderId: folder.id
					})
					.returning({ id: pastesTable.id })

				await db.delete(foldersTable).where(eq(foldersTable.id, folder.id))

				const [stored] = await db
					.select({
						userId: pastesTable.userId,
						folderId: pastesTable.folderId
					})
					.from(pastesTable)
					.where(eq(pastesTable.id, paste.id))
				strictEqual(stored.userId, ownerA.id)
				strictEqual(stored.folderId, null)
			}
		)

		await t.test(
			'deleting a parent clears parentFolderId without clearing child owner',
			async () => {
				const [parent] = await db
					.insert(foldersTable)
					.values({
						name: `Parent${suffix}`,
						userId: ownerA.id
					})
					.returning({ id: foldersTable.id })
				const [child] = await db
					.insert(foldersTable)
					.values({
						name: `Child${suffix}`,
						userId: ownerA.id,
						parentFolderId: parent.id
					})
					.returning({ id: foldersTable.id })

				await db.delete(foldersTable).where(eq(foldersTable.id, parent.id))

				const [stored] = await db
					.select({
						userId: foldersTable.userId,
						parentFolderId: foldersTable.parentFolderId
					})
					.from(foldersTable)
					.where(eq(foldersTable.id, child.id))
				strictEqual(stored.userId, ownerA.id)
				strictEqual(stored.parentFolderId, null)
			}
		)

		await t.test('a paste cannot use another owner\'s folder', async () => {
			const [foreignFolder] = await db
				.insert(foldersTable)
				.values({
					name: `Foreign${suffix}`,
					userId: ownerB.id
				})
				.returning({ id: foldersTable.id })

			await expectPostgresError(
				() =>
					db.insert(pastesTable).values({
						title: 'Cross-owner folder fixture',
						slug: slugs[1],
						content: 'must be rejected',
						userId: ownerA.id,
						folderId: foreignFolder.id
					}),
				'23503'
			)
		})

		await t.test('a folder cannot use another owner\'s parent', async () => {
			const [foreignParent] = await db
				.insert(foldersTable)
				.values({
					name: `ForeignParent${suffix}`,
					userId: ownerB.id
				})
				.returning({ id: foldersTable.id })

			await expectPostgresError(
				() =>
					db.insert(foldersTable).values({
						name: `CrossOwnerChild${suffix}`,
						userId: ownerA.id,
						parentFolderId: foreignParent.id
					}),
				'23503'
			)
		})

		await t.test('a private paste cannot exist without an owner', async () => {
			await expectPostgresError(
				() =>
					db.insert(pastesTable).values({
						title: 'Ownerless private fixture',
						slug: slugs[2],
						content: 'must be rejected',
						visibility: 'private',
						userId: null
					}),
				'23514'
			)
		})

		await t.test('a public guest paste remains valid', async () => {
			const [guestPaste] = await db
				.insert(pastesTable)
				.values({
					title: 'Public guest fixture',
					slug: slugs[3],
					content: 'guest content',
					visibility: 'public',
					userId: null
				})
				.returning({ userId: pastesTable.userId })
			strictEqual(guestPaste.userId, null)
		})

		await t.test('root folder names are unique per owner', async () => {
			const rootName = `DuplicateRoot${suffix}`
			const results = await Promise.allSettled([
				db.insert(foldersTable).values({
					name: rootName,
					userId: ownerA.id,
					parentFolderId: null
				}),
				db.insert(foldersTable).values({
					name: rootName,
					userId: ownerA.id,
					parentFolderId: null
				})
			])

			strictEqual(
				results.filter((result) => result.status === 'fulfilled').length,
				1
			)
			const rejected = results.find((result) => result.status === 'rejected')
			ok(rejected && rejected.status === 'rejected')
			strictEqual(postgresCode(rejected.reason), '23505')
		})

		await t.test('paste and tag pairs are unique', async () => {
			const { paste, tag } = await db.transaction(async (tx) => {
				await tx.execute(sql`SELECT pg_advisory_xact_lock(1146572623)`)
				const [paste] = await tx
					.insert(pastesTable)
					.values({
						title: 'Paste tag uniqueness fixture',
						slug: slugs[4],
						content: 'tag content',
						userId: ownerA.id
					})
					.returning({ id: pastesTable.id })
				const [tag] = await tx
					.insert(tagsTable)
					.values({ name: tagName })
					.returning({ id: tagsTable.id })

				await tx
					.insert(pasteTagsTable)
					.values({ pasteId: paste.id, tagId: tag.id })
				return { paste, tag }
			})

			await expectPostgresError(
				() =>
					db
						.insert(pasteTagsTable)
						.values({ pasteId: paste.id, tagId: tag.id }),
				'23505'
			)
		})
	}
)
