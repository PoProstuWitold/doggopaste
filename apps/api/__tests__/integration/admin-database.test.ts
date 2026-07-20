// biome-ignore-all lint: test files
import { ok, strictEqual } from 'node:assert'
import test from 'node:test'
import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import {
	accountsTable,
	foldersTable,
	pastesTable,
	pasteTagsTable,
	sessionsTable,
	tagsTable,
	usersTable
} from '../../src/db/schema.js'
import { getTestApp, prepareDb } from '../test-utils.js'

type Json = Record<string, any>

test(
	'ADMIN DATABASE: user deletion is atomic',
	{ concurrency: false },
	async (t) => {
		await prepareDb()
		const app = getTestApp()
		const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 10)
		const adminEmail = `admin-db-${suffix}@example.test`
		const victimEmail = `victim-db-${suffix}@example.test`
		const password = 'test-password-123'
		const slug = `admin-delete-${suffix}`
		const tagName = `adm${suffix.slice(0, 8)}`
		const functionName = `test_fail_user_delete_fn_${suffix}`
		const triggerName = `test_fail_user_delete_${suffix}`

		const dropFailureTrigger = async () => {
			await db.execute(
				sql.raw(`DROP TRIGGER IF EXISTS ${triggerName} ON users`)
			)
			await db.execute(
				sql.raw(`DROP FUNCTION IF EXISTS ${functionName}()`)
			)
		}

		t.after(async () => {
			await dropFailureTrigger()
			await db.delete(pastesTable).where(eq(pastesTable.slug, slug))
			await db
				.delete(usersTable)
				.where(inArray(usersTable.email, [adminEmail, victimEmail]))
			await db.delete(tagsTable).where(eq(tagsTable.name, tagName))
		})

		const signUp = async (name: string, email: string) => {
			const response = await app.request(
				'http://localhost:3001/api/auth/sign-up/email',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Origin: 'http://localhost:3001'
					},
					body: JSON.stringify({ name, email, password })
				}
			)
			strictEqual(response.status, 200)
			const json = (await response.json()) as Json
			return {
				cookie: response.headers
					.getSetCookie()
					.map((value) => value.split(';', 1)[0])
					.join('; '),
				id: json.user.id as string
			}
		}

		const admin = await signUp(`admin-db-${suffix}`, adminEmail)
		const victim = await signUp(`victim-db-${suffix}`, victimEmail)
		await db
			.update(usersTable)
			.set({ role: 'admin' })
			.where(eq(usersTable.id, admin.id))

		const signInResponse = await app.request(
			'http://localhost:3001/api/auth/sign-in/email',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Origin: 'http://localhost:3001'
				},
				body: JSON.stringify({ email: adminEmail, password })
			}
		)
		strictEqual(signInResponse.status, 200)
		const adminCookie = signInResponse.headers
			.getSetCookie()
			.map((value) => value.split(';', 1)[0])
			.join('; ')
		ok(adminCookie)

		const [folder] = await db
			.insert(foldersTable)
			.values({ name: `AdminDelete${suffix}`, userId: victim.id })
			.returning({ id: foldersTable.id })
		const createResponse = await app.request('/api/pastes', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Origin: 'http://localhost:3001',
				Cookie: victim.cookie
			},
			body: JSON.stringify({
				title: 'Admin deletion transaction fixture',
				slug,
				content: 'private content',
				category: 'none',
				tags: [tagName],
				syntax: 'Plaintext',
				expiration: 'never',
				visibility: 'private',
				folder: folder.id,
				password: '',
				passwordEnabled: false,
				encrypted: false,
				pasteAsGuest: false
			})
		})
		strictEqual(createResponse.status, 201)
		const created = (await createResponse.json()) as Json
		const pasteId = created.data.id as string

		await db.execute(
			sql.raw(`CREATE FUNCTION ${functionName}()
				RETURNS trigger
				LANGUAGE plpgsql
				AS $$
				BEGIN
					IF OLD.id = '${victim.id}'::uuid THEN
						RAISE EXCEPTION 'forced user deletion failure';
					END IF;
					RETURN OLD;
				END;
				$$`)
		)
		await db.execute(
			sql.raw(`CREATE TRIGGER ${triggerName}
				BEFORE DELETE ON users
				FOR EACH ROW
				EXECUTE FUNCTION ${functionName}()`)
		)

		const deleteUser = () =>
			app.request(`/api/admin/users/${victim.id}`, {
				method: 'DELETE',
				headers: {
					Origin: 'http://localhost:3001',
					Cookie: adminCookie
				}
			})

		const failedResponse = await deleteUser()
		strictEqual(failedResponse.status, 500)
		await dropFailureTrigger()

		const [storedUser] = await db
			.select({ id: usersTable.id })
			.from(usersTable)
			.where(eq(usersTable.id, victim.id))
		const [storedPaste] = await db
			.select({ id: pastesTable.id })
			.from(pastesTable)
			.where(eq(pastesTable.id, pasteId))
		const [storedFolder] = await db
			.select({ id: foldersTable.id })
			.from(foldersTable)
			.where(eq(foldersTable.id, folder.id))
		const storedSessions = await db
			.select({ id: sessionsTable.id })
			.from(sessionsTable)
			.where(eq(sessionsTable.userId, victim.id))
		const storedAccounts = await db
			.select({ id: accountsTable.id })
			.from(accountsTable)
			.where(eq(accountsTable.userId, victim.id))
		const [storedRelation] = await db
			.select({ id: pasteTagsTable.id })
			.from(pasteTagsTable)
			.where(eq(pasteTagsTable.pasteId, pasteId))
		ok(storedUser)
		ok(storedPaste)
		ok(storedFolder)
		ok(storedRelation)
		strictEqual(storedSessions.length > 0, true)
		strictEqual(storedAccounts.length > 0, true)

		const successfulResponse = await deleteUser()
		strictEqual(successfulResponse.status, 200)
		const repeatedResponse = await deleteUser()
		strictEqual(repeatedResponse.status, 404)

		const [deletedUser] = await db
			.select({ id: usersTable.id })
			.from(usersTable)
			.where(eq(usersTable.id, victim.id))
		const [deletedPaste] = await db
			.select({ id: pastesTable.id })
			.from(pastesTable)
			.where(eq(pastesTable.id, pasteId))
		const [deletedFolder] = await db
			.select({ id: foldersTable.id })
			.from(foldersTable)
			.where(eq(foldersTable.id, folder.id))
		const [orphanTag] = await db
			.select({ id: tagsTable.id })
			.from(tagsTable)
			.where(eq(tagsTable.name, tagName))
		strictEqual(deletedUser, undefined)
		strictEqual(deletedPaste, undefined)
		strictEqual(deletedFolder, undefined)
		strictEqual(orphanTag, undefined)
	}
)
