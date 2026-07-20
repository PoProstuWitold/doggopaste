// biome-ignore-all lint: test files
import { ok, strictEqual } from 'node:assert'
import test from 'node:test'
import { eq } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import { syntaxesTable, usersTable } from '../../src/db/schema.js'
import { getTestApp, prepareDb } from '../test-utils.js'

type Json = Record<string, any>

test(
	'ADMIN: syntax updates',
	{ concurrency: false },
	async (t) => {
		await prepareDb()
		const app = getTestApp()
		const suffix = crypto.randomUUID().replaceAll('-', '')
		const email = `admin-syntax-${suffix}@example.test`
		const password = 'test-password-123'
		let syntaxId: string | undefined

		t.after(async () => {
			if (syntaxId) {
				await db
					.delete(syntaxesTable)
					.where(eq(syntaxesTable.id, syntaxId))
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
					name: `admin-syntax-${suffix}`,
					email,
					password
				})
			}
		)
		strictEqual(signUpResponse.status, 200)
		const signUpJson = (await signUpResponse.json()) as Json
		await db
			.update(usersTable)
			.set({ role: 'admin' })
			.where(eq(usersTable.id, signUpJson.user.id as string))

		const signInResponse = await app.request(
			'http://localhost:3001/api/auth/sign-in/email',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Origin: 'http://localhost:3001'
				},
				body: JSON.stringify({ email, password })
			}
		)
		strictEqual(signInResponse.status, 200)

		const cookie = signInResponse.headers
			.getSetCookie()
			.map((value) => value.split(';', 1)[0])
			.join('; ')
		ok(cookie)

		const headers = {
			'Content-Type': 'application/json',
			Origin: 'http://localhost:3001',
			Cookie: cookie
		}
		const updateSyntax = (
			id: string,
			body: Record<string, unknown>
		) =>
			app.request(`/api/admin/syntaxes/${id}`, {
				method: 'PUT',
				headers,
				body: JSON.stringify(body)
			})

		const [syntax] = await db
			.insert(syntaxesTable)
			.values({
				name: `AdminSyntax${suffix}`,
				extension: 'txt',
				color: '#808080'
			})
			.returning({ id: syntaxesTable.id })
		syntaxId = syntax.id

		await t.test('updates a safe multi-part extension', async () => {
			const response = await updateSyntax(syntax.id, {
				name: `UpdatedAdminSyntax${suffix}`,
				extension: 'ng.ts',
				color: '#112233'
			})
			strictEqual(response.status, 200)

			const [updated] = await db
				.select({ extension: syntaxesTable.extension })
				.from(syntaxesTable)
				.where(eq(syntaxesTable.id, syntax.id))
			strictEqual(updated.extension, 'ng.ts')
		})

		await t.test('returns 404 when the syntax does not exist', async () => {
			const response = await updateSyntax(crypto.randomUUID(), {
				name: `MissingAdminSyntax${suffix}`,
				extension: 'txt',
				color: '#808080'
			})
			strictEqual(response.status, 404)
			const json = (await response.json()) as Json
			strictEqual(json.message, 'Syntax not found')
		})

		await t.test('returns 409 only for a unique-name conflict', async () => {
			const response = await updateSyntax(syntax.id, {
				name: 'Plaintext',
				extension: 'txt',
				color: '#808080'
			})
			strictEqual(response.status, 409)
			const json = (await response.json()) as Json
			strictEqual(json.message, 'Syntax name already exists')
		})

		await t.test('rejects an unsafe extension before the update', async () => {
			const response = await updateSyntax(syntax.id, {
				name: `UnsafeAdminSyntax${suffix}`,
				extension: 'txt\r\nX-Injected',
				color: '#808080'
			})
			strictEqual(response.status, 400)
		})

		await t.test('allows clearing a nullable extension', async () => {
			const response = await updateSyntax(syntax.id, {
				name: `NoExtensionAdminSyntax${suffix}`,
				extension: null,
				color: '#808080'
			})
			strictEqual(response.status, 200)

			const [updated] = await db
				.select({ extension: syntaxesTable.extension })
				.from(syntaxesTable)
				.where(eq(syntaxesTable.id, syntax.id))
			strictEqual(updated.extension, null)
		})
	}
)
