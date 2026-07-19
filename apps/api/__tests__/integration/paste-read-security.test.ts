// biome-ignore-all lint: test files
import { ok, strictEqual } from 'node:assert'
import test from 'node:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import {
	foldersTable,
	pastesTable,
	usersTable
} from '../../src/db/schema.js'
import { getTestApp, prepareDb } from '../test-utils.js'

type Json = Record<string, any>

test(
	'PASTE READ SECURITY: response DTOs, access, expiration and hits',
	{ concurrency: false },
	async (t) => {
		await prepareDb()
		const app = getTestApp()
		const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
		const email = `paste-security-${suffix}@example.test`
		const slugs = {
			publicPlain: `public-plain-${suffix}`,
			publicProtected: `public-protected-${suffix}`,
			privatePlain: `private-plain-${suffix}`,
			privateProtected: `private-protected-${suffix}`,
			expired: `expired-${suffix}`,
			expiredInFolder: `expired-folder-${suffix}`
		}

		t.after(async () => {
			await db
				.delete(pastesTable)
				.where(inArray(pastesTable.slug, Object.values(slugs)))
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
					name: `paste-security-${suffix}`,
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

		const jsonHeaders = (authenticated = false) => ({
			'Content-Type': 'application/json',
			Origin: 'http://localhost:3001',
			...(authenticated ? { Cookie: cookie } : {})
		})

		const pasteBody = (
			slug: string,
			overrides: Record<string, unknown> = {}
		) => ({
			title: `Security fixture ${slug}`,
			slug,
			description: 'Paste read security regression fixture',
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

		const createPaste = async (
			slug: string,
			overrides: Record<string, unknown> = {}
		) => {
			const response = await app.request('/api/pastes', {
				method: 'POST',
				headers: jsonHeaders(true),
				body: JSON.stringify(pasteBody(slug, overrides))
			})
			const json = (await response.json()) as Json
			strictEqual(response.status, 201)
			strictEqual(json.data.userId, userId)
			return json.data as Json
		}

		const publicPlain = await createPaste(slugs.publicPlain)
		const publicProtected = await createPaste(slugs.publicProtected, {
			password: 'correct-password',
			passwordEnabled: true
		})
		const privatePlain = await createPaste(slugs.privatePlain, {
			visibility: 'private'
		})
		const privateProtected = await createPaste(slugs.privateProtected, {
			visibility: 'private',
			password: 'private-password',
			passwordEnabled: true
		})
		const expired = await createPaste(slugs.expired, {
			expiration: '10m',
			password: 'expired-password',
			passwordEnabled: true
		})

		const [folder] = await db
			.insert(foldersTable)
			.values({
				name: `Security${Date.now()}`,
				userId
			})
			.returning({ id: foldersTable.id })

		const expiredInFolder = await createPaste(slugs.expiredInFolder, {
			expiration: '10m',
			folder: folder.id
		})

		await db
			.update(pastesTable)
			.set({ expiresAt: new Date('2000-01-01T00:00:00.000Z') })
			.where(
				inArray(pastesTable.id, [expired.id, expiredInFolder.id])
			)
		await db
			.update(pastesTable)
			.set({ syntaxId: null })
			.where(eq(pastesTable.id, publicPlain.id))

		await t.test('create and update return safe details DTOs', async () => {
			strictEqual(publicProtected.passwordProtected, true)
			strictEqual('passwordHash' in publicProtected, false)

			const response = await app.request(
				`/api/pastes/${slugs.publicProtected}`,
				{
					method: 'PUT',
					headers: jsonHeaders(true),
					body: JSON.stringify(
						pasteBody(slugs.publicProtected, {
							folder: folder.id,
							password: 'correct-password',
							passwordEnabled: true
						})
					)
				}
			)
			const json = (await response.json()) as Json
			strictEqual(response.status, 200)
			strictEqual(json.data.passwordProtected, true)
			strictEqual('passwordHash' in json.data, false)
		})

		await t.test('public, user and folder lists expose summaries only', async () => {
			const publicResponse = await app.request(
				`/api/pastes?limit=100&offset=0`
			)
			const publicJson = (await publicResponse.json()) as Json
			const publicItem = publicJson.data.find(
				(item: Json) => item.slug === slugs.publicProtected
			)
			ok(publicItem)
			strictEqual('content' in publicItem, false)
			strictEqual('passwordHash' in publicItem, false)
			strictEqual(publicItem.passwordProtected, true)
			strictEqual(
				publicJson.data.some((item: Json) => item.slug === slugs.expired),
				false
			)

			const userResponse = await app.request(
				`/api/user/pastes?userId=${userId}&limit=100&offset=0`,
				{ headers: jsonHeaders(true) }
			)
			const userJson = (await userResponse.json()) as Json
			const userItem = userJson.data.find(
				(item: Json) => item.slug === slugs.publicProtected
			)
			ok(userItem)
			strictEqual('content' in userItem, false)
			strictEqual('passwordHash' in userItem, false)
			strictEqual(
				userJson.data.some((item: Json) => item.slug === slugs.expired),
				false
			)

			const folderResponse = await app.request(
				`/api/folders/f/${folder.id}`,
				{ headers: jsonHeaders(true) }
			)
			const folderJson = (await folderResponse.json()) as Json
			const folderItem = folderJson.data.pastes.find(
				(item: Json) => item.slug === slugs.publicProtected
			)
			ok(folderItem)
			strictEqual('content' in folderItem, false)
			strictEqual('passwordHash' in folderItem, false)
			strictEqual(
				folderJson.data.pastes.some(
					(item: Json) => item.slug === slugs.expiredInFolder
				),
				false
			)
			strictEqual(folderJson.data.folder.pastesCount, 1)
		})

		await t.test('details never expose passwordHash', async () => {
			const response = await app.request(
				`/api/pastes/${slugs.publicProtected}`
			)
			const json = (await response.json()) as Json
			strictEqual(response.status, 200)
			strictEqual(json.data.content, '')
			strictEqual(json.data.passwordProtected, true)
			strictEqual('passwordHash' in json.data, false)
		})

		await t.test('details support a paste without a syntax', async () => {
			const response = await app.request(
				`/api/pastes/${slugs.publicPlain}`
			)
			const json = (await response.json()) as Json
			strictEqual(response.status, 200)
			strictEqual(json.data.syntax.name, 'Plaintext')
			strictEqual(json.data.syntax.extension, 'txt')
			strictEqual(json.data.syntax.color, '#808080')
		})

		await t.test('verify cannot bypass private visibility', async () => {
			for (const [slug, password] of [
				[slugs.privatePlain, 'anything'],
				[slugs.privateProtected, 'wrong-password'],
				[slugs.privateProtected, 'private-password']
			]) {
				const response = await app.request(`/api/pastes/${slug}/verify`, {
					method: 'POST',
					headers: jsonHeaders(),
					body: JSON.stringify({ password })
				})
				const json = (await response.json()) as Json
				strictEqual(response.status, 404)
				strictEqual('content' in json, false)
				strictEqual('passwordHash' in json, false)
			}
		})

		await t.test(
			'verify never returns content for an unprotected paste',
			async () => {
				const response = await app.request(
					`/api/pastes/${slugs.publicPlain}/verify`,
					{
						method: 'POST',
						headers: jsonHeaders(),
						body: JSON.stringify({ password: 'anything' })
					}
				)
				const json = (await response.json()) as Json
				strictEqual(response.status, 400)
				strictEqual('content' in json, false)
				strictEqual('passwordHash' in json, false)
			}
		)

		await t.test('owner can read a private paste', async () => {
			const response = await app.request(
				`/api/pastes/${slugs.privatePlain}`,
				{ headers: jsonHeaders(true) }
			)
			const json = (await response.json()) as Json
			strictEqual(response.status, 200)
			strictEqual(json.data.content, privatePlain.content)
			strictEqual('passwordHash' in json.data, false)
		})

		await t.test(
			'owner can unlock a password-protected private paste',
			async () => {
				const response = await app.request(
					`/api/pastes/${slugs.privateProtected}/verify`,
					{
						method: 'POST',
						headers: jsonHeaders(true),
						body: JSON.stringify({ password: 'private-password' })
					}
				)
				const json = (await response.json()) as Json
				strictEqual(response.status, 200)
				strictEqual(
					json.content,
					`content-${slugs.privateProtected}`
				)
				strictEqual('passwordHash' in json, false)
			}
		)

		await t.test('expired paste is rejected by every API read gate', async () => {
			const getResponse = await app.request(`/api/pastes/${slugs.expired}`)
			strictEqual(getResponse.status, 404)

			const verifyResponse = await app.request(
				`/api/pastes/${slugs.expired}/verify`,
				{
					method: 'POST',
					headers: jsonHeaders(),
					body: JSON.stringify({ password: 'expired-password' })
				}
			)
			strictEqual(verifyResponse.status, 404)

			const downloadResponse = await app.request(
				`/api/pastes/${slugs.expired}/download?password=expired-password`
			)
			strictEqual(downloadResponse.status, 404)
		})

		await t.test('failed reads do not increase hits', async () => {
			await db
				.update(pastesTable)
				.set({ hits: 23 })
				.where(eq(pastesTable.id, publicProtected.id))

			const detailsResponse = await app.request(
				`/api/pastes/${slugs.publicProtected}`
			)
			strictEqual(detailsResponse.status, 200)

			const wrongPasswordResponse = await app.request(
				`/api/pastes/${slugs.publicProtected}/verify`,
				{
					method: 'POST',
					headers: jsonHeaders(),
					body: JSON.stringify({ password: 'wrong-password' })
				}
			)
			strictEqual(wrongPasswordResponse.status, 403)

			let [row] = await db
				.select({ hits: pastesTable.hits })
				.from(pastesTable)
				.where(eq(pastesTable.id, publicProtected.id))
			strictEqual(row.hits, 23)

			const correctPasswordResponse = await app.request(
				`/api/pastes/${slugs.publicProtected}/verify`,
				{
					method: 'POST',
					headers: jsonHeaders(),
					body: JSON.stringify({ password: 'correct-password' })
				}
			)
			strictEqual(correctPasswordResponse.status, 200)

			;[row] = await db
				.select({ hits: pastesTable.hits })
				.from(pastesTable)
				.where(eq(pastesTable.id, publicProtected.id))
			strictEqual(row.hits, 24)

			await db
				.update(pastesTable)
				.set({ hits: 31 })
				.where(eq(pastesTable.id, privateProtected.id))
			const privateResponse = await app.request(
				`/api/pastes/${slugs.privateProtected}`
			)
			strictEqual(privateResponse.status, 404)

			const privateVerifyResponse = await app.request(
				`/api/pastes/${slugs.privateProtected}/verify`,
				{
					method: 'POST',
					headers: jsonHeaders(),
					body: JSON.stringify({ password: 'private-password' })
				}
			)
			strictEqual(privateVerifyResponse.status, 404)

			const [privateRow] = await db
				.select({ hits: pastesTable.hits })
				.from(pastesTable)
				.where(eq(pastesTable.id, privateProtected.id))
			strictEqual(privateRow.hits, 31)
		})
	}
)
