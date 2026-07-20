// biome-ignore-all lint: test files
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import test from 'node:test'
import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import {
	pastesTable,
	pasteTagsTable,
	tagsTable,
	usersTable
} from '../../src/db/schema.js'
import { getTestApp, prepareDb } from '../test-utils.js'

type Json = Record<string, any>

function assertExactlyOneBurnWinner(responses: Response[]) {
	strictEqual(
		responses.filter((response) => response.status === 200).length,
		1
	)
	strictEqual(
		responses.filter((response) => response.status === 404).length,
		responses.length - 1
	)
}

async function waitForBlockedPasteMutation() {
	for (let attempt = 0; attempt < 100; attempt += 1) {
		const result = await db.execute<{ count: number }>(sql`
			SELECT count(*)::integer AS count
			FROM pg_catalog.pg_stat_activity
			WHERE wait_event_type = 'Lock'
				AND wait_event = 'advisory'
				AND query LIKE 'SELECT pg_advisory_xact_lock(1146572623)%'
		`)
		if (Number(result.rows[0]?.count) > 0) return
		await new Promise((resolve) => setTimeout(resolve, 10))
	}
	throw new Error('Burn request did not wait for the paste mutation lock')
}

test(
	'PASTE TRANSACTIONS: writes, tag races and atomic burn',
	{ concurrency: false },
	async (t) => {
		await prepareDb()
		const app = getTestApp()
		const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 10)
		const shortSuffix = suffix.slice(0, 8)
		const email = `paste-tx-${suffix}@example.test`
		const password = 'test-password-123'
		const createdSlugs = new Set<string>()
		const fixtureTags = new Set<string>()
		const triggerName = `test_fail_pt_${suffix}`
		const functionName = `test_fail_pt_fn_${suffix}`

		const dropFailureTrigger = async () => {
			await db.execute(
				sql.raw(
					`DROP TRIGGER IF EXISTS ${triggerName} ON paste_tags`
				)
			)
			await db.execute(
				sql.raw(`DROP FUNCTION IF EXISTS ${functionName}()`)
			)
		}
		const installFailureTrigger = async (tagName: string) => {
			await db.execute(
				sql.raw(`CREATE FUNCTION ${functionName}()
					RETURNS trigger
					LANGUAGE plpgsql
					AS $$
					BEGIN
						IF EXISTS (
							SELECT 1 FROM tags
							WHERE id = NEW.tag_id AND name = '${tagName}'
						) THEN
							RAISE EXCEPTION 'forced paste_tags failure';
						END IF;
						RETURN NEW;
					END;
					$$`)
			)
			await db.execute(
				sql.raw(`CREATE TRIGGER ${triggerName}
					BEFORE INSERT ON paste_tags
					FOR EACH ROW
					EXECUTE FUNCTION ${functionName}()`)
			)
		}

		t.after(async () => {
			await dropFailureTrigger()
			if (createdSlugs.size > 0) {
				await db
					.delete(pastesTable)
					.where(inArray(pastesTable.slug, [...createdSlugs]))
			}
			if (fixtureTags.size > 0) {
				await db
					.delete(tagsTable)
					.where(inArray(tagsTable.name, [...fixtureTags]))
			}
			await db.delete(usersTable).where(eq(usersTable.email, email))
		})

		const signUpResponse = await app.request(
			'http://localhost:3001/api/auth/sign-up/email',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Origin: 'http://localhost:3001'
				},
				body: JSON.stringify({
					name: `paste-tx-${suffix}`,
					email,
					password
				})
			}
		)
		strictEqual(signUpResponse.status, 200)
		const signUpJson = (await signUpResponse.json()) as Json
		const userId = signUpJson.user.id as string
		const cookie = signUpResponse.headers
			.getSetCookie()
			.map((value) => value.split(';', 1)[0])
			.join('; ')
		ok(cookie)

		const jsonHeaders = (authenticated = true) => ({
			'Content-Type': 'application/json',
			Origin: 'http://localhost:3001',
			...(authenticated ? { Cookie: cookie } : {})
		})
		const pasteBody = (
			slug: string,
			overrides: Record<string, unknown> = {}
		) => ({
			title: `Transaction fixture ${slug}`,
			slug,
			description: 'Database transaction regression fixture',
			content: `content-${slug}`,
			category: 'snippet',
			tags: [],
			syntax: 'Plaintext',
			expiration: 'never',
			visibility: 'public',
			folder: 'none',
			password: '',
			passwordEnabled: false,
			encrypted: false,
			pasteAsGuest: false,
			...overrides
		})
		const requestCreate = (
			slug: string,
			overrides: Record<string, unknown> = {}
		) => {
			createdSlugs.add(slug)
			return app.request('/api/pastes', {
				method: 'POST',
				headers: jsonHeaders(),
				body: JSON.stringify(pasteBody(slug, overrides))
			})
		}
		const createPaste = async (
			slug: string,
			overrides: Record<string, unknown> = {}
		) => {
			const response = await requestCreate(slug, overrides)
			const json = (await response.json()) as Json
			strictEqual(response.status, 201)
			strictEqual(json.data.userId, userId)
			return json.data as Json
		}
		const storedPasteBySlug = async (slug: string) => {
			const [paste] = await db
				.select()
				.from(pastesTable)
				.where(eq(pastesTable.slug, slug))
			return paste
		}
		const storedTagNames = async (pasteId: string) => {
			const rows = await db
				.select({ name: tagsTable.name })
				.from(pasteTagsTable)
				.innerJoin(tagsTable, eq(pasteTagsTable.tagId, tagsTable.id))
				.where(eq(pasteTagsTable.pasteId, pasteId))
			return rows.map((row) => row.name).sort()
		}

		await t.test(
			'create rolls back the paste and its new tag after a late DB failure',
			async () => {
				const slug = `tx-create-rollback-${suffix}`
				const rollbackTag = `cr${shortSuffix}`
				fixtureTags.add(rollbackTag)
				await installFailureTrigger(rollbackTag)

				const response = await (async () => {
					try {
						return await requestCreate(slug, { tags: [rollbackTag] })
					} finally {
						await dropFailureTrigger()
					}
				})()
				strictEqual(response.status, 500)
				strictEqual(await storedPasteBySlug(slug), undefined)

				const [storedTag] = await db
					.select({ id: tagsTable.id })
					.from(tagsTable)
					.where(eq(tagsTable.name, rollbackTag))
				strictEqual(storedTag, undefined)
			}
		)

		await t.test(
			'update rolls back paste fields and old tag links after a late DB failure',
			async () => {
				const slug = `tx-update-${suffix}`
				const oldTag = `old${shortSuffix}`
				const failingTag = `fail${shortSuffix}`
				fixtureTags.add(oldTag)
				fixtureTags.add(failingTag)
				const originalTitle = 'Original transactional title'
				const originalContent = 'original transactional content'
				const created = await createPaste(slug, {
					title: originalTitle,
					content: originalContent,
					tags: [oldTag]
				})
				await installFailureTrigger(failingTag)

				const response = await (async () => {
					try {
						return await app.request(`/api/pastes/${slug}`, {
							method: 'PUT',
							headers: jsonHeaders(),
							body: JSON.stringify(
								pasteBody(slug, {
									title: 'Must be rolled back',
									content: 'must be rolled back',
									tags: [failingTag]
								})
							)
						})
					} finally {
						await dropFailureTrigger()
					}
				})()
				strictEqual(response.status, 500)

				const stored = await storedPasteBySlug(slug)
				strictEqual(stored.id, created.id)
				strictEqual(stored.title, originalTitle)
				strictEqual(stored.content, originalContent)
				deepStrictEqual(await storedTagNames(stored.id), [oldTag])
				const [rolledBackTag] = await db
					.select({ id: tagsTable.id })
					.from(tagsTable)
					.where(eq(tagsTable.name, failingTag))
				strictEqual(rolledBackTag, undefined)
			}
		)

		await t.test(
			'duplicate tags in one payload create one paste_tags row',
			async () => {
				const slug = `tx-deduplicate-${suffix}`
				const duplicateTag = `dup${shortSuffix}`
				fixtureTags.add(duplicateTag)
				const created = await createPaste(slug, {
					tags: [duplicateTag, duplicateTag]
				})
				deepStrictEqual(await storedTagNames(created.id), [duplicateTag])

				const response = await app.request(`/api/pastes/${slug}`, {
					method: 'PUT',
					headers: jsonHeaders(),
					body: JSON.stringify(
						pasteBody(slug, {
							title: 'Deduplicated update',
							tags: [duplicateTag, duplicateTag]
						})
					)
				})
				strictEqual(response.status, 200)
				deepStrictEqual(await storedTagNames(created.id), [duplicateTag])
			}
		)

		await t.test(
			'concurrent creates safely share one tag row',
			async () => {
				const firstSlug = `tx-shared-a-${suffix}`
				const secondSlug = `tx-shared-b-${suffix}`
				const sharedTag = `shr${shortSuffix}`
				fixtureTags.add(sharedTag)
				const responses = await Promise.all([
					requestCreate(firstSlug, { tags: [sharedTag] }),
					requestCreate(secondSlug, { tags: [sharedTag] })
				])
				deepStrictEqual(
					responses.map((response) => response.status).sort(),
					[201, 201]
				)

				const tagRows = await db
					.select({ id: tagsTable.id })
					.from(tagsTable)
					.where(eq(tagsTable.name, sharedTag))
				strictEqual(tagRows.length, 1)
				const relationRows = await db
					.select({ id: pasteTagsTable.id })
					.from(pasteTagsTable)
					.where(eq(pasteTagsTable.tagId, tagRows[0].id))
				strictEqual(relationRows.length, 2)
			}
		)

		await t.test(
			'attaching an orphan tag cannot race paste cleanup',
			async () => {
				const sourceSlug = `tx-cleanup-source-${suffix}`
				const attachedSlug = `tx-cleanup-attach-${suffix}`
				const sourceTag = `src${shortSuffix}`
				const orphanTag = `orc${shortSuffix}`
				fixtureTags.add(sourceTag)
				fixtureTags.add(orphanTag)
				await createPaste(sourceSlug, { tags: [sourceTag] })
				await db
					.insert(tagsTable)
					.values({ name: orphanTag })
					.onConflictDoNothing({ target: tagsTable.name })

				const [createResponse, deleteResponse] = await Promise.all([
					requestCreate(attachedSlug, { tags: [orphanTag] }),
					app.request(`/api/pastes/${sourceSlug}`, {
						method: 'DELETE',
						headers: jsonHeaders()
					})
				])
				strictEqual(createResponse.status, 201)
				strictEqual(deleteResponse.status, 200)

				const attachedPaste = await storedPasteBySlug(attachedSlug)
				ok(attachedPaste)
				deepStrictEqual(await storedTagNames(attachedPaste.id), [orphanTag])
			}
		)

		await t.test(
			'burn claim rejects an authorization snapshot made before a later edit',
			async () => {
				const slug = `tx-burn-stale-${suffix}`
				const created = await createPaste(slug, {
					content: 'content selected before the edit',
					expiration: 'burn_after_read'
				})
				let releaseLock = () => {}
				let signalLockReady = () => {}
				const lockReady = new Promise<void>((resolve) => {
					signalLockReady = resolve
				})
				const lockRelease = new Promise<void>((resolve) => {
					releaseLock = resolve
				})
				const lockHolder = db.transaction(async (tx) => {
					await tx.execute(
						sql`SELECT pg_advisory_xact_lock(1146572623)`
					)
					signalLockReady()
					await lockRelease
				})
				await lockReady

				const responsePromise = app.request(`/api/pastes/${slug}`)
				try {
					await waitForBlockedPasteMutation()
					await db
						.update(pastesTable)
						.set({ content: 'content committed after authorization' })
						.where(eq(pastesTable.id, created.id))
				} finally {
					releaseLock()
					await lockHolder
				}

				const response = await responsePromise
				strictEqual(response.status, 404)
				const stored = await storedPasteBySlug(slug)
				ok(stored)
				strictEqual(
					stored.content,
					'content committed after authorization'
				)
			}
		)

		await t.test(
			'concurrent details consume a plain burn paste exactly once',
			async () => {
				const slug = `tx-burn-details-${suffix}`
				const content = `plain burn content ${suffix}`
				const burnTag = `brn${shortSuffix}`
				fixtureTags.add(burnTag)
				await createPaste(slug, {
					content,
					expiration: 'burn_after_read',
					tags: [burnTag]
				})
				const responses = await Promise.all(
					Array.from({ length: 4 }, () =>
						app.request(`/api/pastes/${slug}`)
					)
				)
				assertExactlyOneBurnWinner(responses)
				const winner = responses.find((response) => response.status === 200)
				ok(winner)
				const json = (await winner.json()) as Json
				strictEqual(json.data.content, content)
				strictEqual(await storedPasteBySlug(slug), undefined)
				const [orphanTag] = await db
					.select({ id: tagsTable.id })
					.from(tagsTable)
					.where(eq(tagsTable.name, burnTag))
				strictEqual(orphanTag, undefined)
			}
		)

		await t.test(
			'concurrent verify requests consume a protected burn paste exactly once',
			async () => {
				const slug = `tx-burn-verify-${suffix}`
				const content = `verified burn content ${suffix}`
				const burnPassword = 'burn-verify-password'
				await createPaste(slug, {
					content,
					expiration: 'burn_after_read',
					password: burnPassword,
					passwordEnabled: true
				})
				const responses = await Promise.all(
					Array.from({ length: 3 }, () =>
						app.request(`/api/pastes/${slug}/verify`, {
							method: 'POST',
							headers: jsonHeaders(false),
							body: JSON.stringify({ password: burnPassword })
						})
					)
				)
				assertExactlyOneBurnWinner(responses)
				const winner = responses.find((response) => response.status === 200)
				ok(winner)
				const json = (await winner.json()) as Json
				strictEqual(json.content, content)
				strictEqual(await storedPasteBySlug(slug), undefined)
			}
		)

		await t.test(
			'concurrent downloads consume a protected burn paste exactly once',
			async () => {
				const slug = `tx-burn-download-${suffix}`
				const content = `downloaded burn content ${suffix}`
				const burnPassword = 'burn-download-password'
				await createPaste(slug, {
					content,
					expiration: 'burn_after_read',
					password: burnPassword,
					passwordEnabled: true
				})
				const responses = await Promise.all(
					Array.from({ length: 3 }, () =>
						app.request(`/api/pastes/${slug}/download`, {
							method: 'POST',
							headers: jsonHeaders(false),
							body: JSON.stringify({ password: burnPassword })
						})
					)
				)
				assertExactlyOneBurnWinner(responses)
				const winner = responses.find((response) => response.status === 200)
				ok(winner)
				strictEqual(await winner.text(), content)
				strictEqual(await storedPasteBySlug(slug), undefined)
			}
		)

		await t.test(
			'CSE burn details preserve the existing local-decryption semantics',
			async () => {
				const slug = `tx-burn-cse-${suffix}`
				const ciphertext = `client-encrypted-payload-${suffix}`
				await createPaste(slug, {
					content: ciphertext,
					expiration: 'burn_after_read',
					encrypted: true,
					password: null,
					passwordEnabled: true
				})

				for (const expectedHits of [1, 2]) {
					const response = await app.request(`/api/pastes/${slug}`)
					const json = (await response.json()) as Json
					strictEqual(response.status, 200)
					strictEqual(json.data.content, ciphertext)
					strictEqual(json.data.encrypted, true)
					strictEqual(json.data.hits, expectedHits)
				}

				const stored = await storedPasteBySlug(slug)
				ok(stored)
				strictEqual(stored.hits, 2)
			}
		)
	}
)
