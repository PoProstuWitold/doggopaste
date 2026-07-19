// biome-ignore-all lint: test files
import { ok, strictEqual } from 'node:assert'
import test from 'node:test'
import { eq } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import { usersTable } from '../../src/db/schema.js'
import { getTestApp, prepareDb } from '../test-utils.js'

type Json = Record<string, any>

test(
	'FOLDERS: /api/folders',
	{ concurrency: false },
	async (t) => {
		await prepareDb()
		const app = getTestApp()
		const suffix = crypto.randomUUID().replaceAll('-', '')
		const email = `folder-${suffix}@example.test`

		t.after(async () => {
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
					name: `folder-${suffix}`,
					email,
					password: 'test-password-123'
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

		const folderName = `Folder${suffix.slice(0, 12)}`
		const createFolder = () =>
			app.request('/api/folders', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Origin: 'http://localhost:3001',
					Cookie: cookie
				},
				body: JSON.stringify({ name: folderName, parentId: null })
			})

		await t.test(
			'returns one folder object with create-or-reuse status semantics',
			async () => {
				const createdResponse = await createFolder()
				const createdJson = (await createdResponse.json()) as Json

				strictEqual(createdResponse.status, 201)
				strictEqual(createdJson.success, true)
				strictEqual(Array.isArray(createdJson.data), false)
				strictEqual(typeof createdJson.data.id, 'string')
				strictEqual(createdJson.data.name, folderName)
				strictEqual(createdJson.data.parentFolderId, null)
				strictEqual(createdJson.data.userId, userId)

				const reusedResponse = await createFolder()
				const reusedJson = (await reusedResponse.json()) as Json

				strictEqual(reusedResponse.status, 200)
				strictEqual(reusedJson.success, true)
				strictEqual(Array.isArray(reusedJson.data), false)
				strictEqual(reusedJson.data.id, createdJson.data.id)
			}
		)
	}
)
