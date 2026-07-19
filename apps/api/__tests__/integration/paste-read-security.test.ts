// biome-ignore-all lint: test files
import { ok, strictEqual } from 'node:assert'
import test from 'node:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import {
	foldersTable,
	pasteTagsTable,
	pastesTable,
	tagsTable,
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
		const protectedContent = `Zażółć gęślą jaźń — ${suffix} 🐕\n`
		const tagSuffix = crypto.randomUUID().replaceAll('-', '').slice(0, 10)
		const rejectedTags = [`auth${tagSuffix}`, `anon${tagSuffix}`]
		const slugs = {
			publicPlain: `public-plain-${suffix}`,
			publicProtected: `public-protected-${suffix}`,
			privatePlain: `private-plain-${suffix}`,
			privateProtected: `private-protected-${suffix}`,
			expired: `expired-${suffix}`,
			expiredInFolder: `expired-folder-${suffix}`,
			burnProtected: `burn-protected-${suffix}`,
			rejectedAuthenticatedPrivate: `reject-auth-${suffix}`,
			rejectedAnonymousPrivate: `reject-anon-${suffix}`
		}

		t.after(async () => {
			await db
				.delete(pastesTable)
				.where(inArray(pastesTable.slug, Object.values(slugs)))
			await db.delete(tagsTable).where(inArray(tagsTable.name, rejectedTags))
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
			content: protectedContent,
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
		const burnProtected = await createPaste(slugs.burnProtected, {
			expiration: 'burn_after_read',
			password: 'burn-password',
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

		await t.test(
			'private pastes cannot be created without an owner or with guest mode',
			async () => {
				const authenticatedResponse = await app.request('/api/pastes', {
					method: 'POST',
					headers: jsonHeaders(true),
					body: JSON.stringify(
						pasteBody(slugs.rejectedAuthenticatedPrivate, {
							visibility: 'private',
							pasteAsGuest: true,
							tags: [rejectedTags[0]]
						})
					)
				})
				strictEqual(authenticatedResponse.status, 400)

				for (const pasteAsGuest of [false, true]) {
					const anonymousResponse = await app.request('/api/pastes', {
						method: 'POST',
						headers: jsonHeaders(),
						body: JSON.stringify(
							pasteBody(slugs.rejectedAnonymousPrivate, {
								visibility: 'private',
								pasteAsGuest,
								tags: [rejectedTags[1]]
							})
						)
					})
					strictEqual(anonymousResponse.status, 401)
				}

				const rejectedSlugs = [
					slugs.rejectedAuthenticatedPrivate,
					slugs.rejectedAnonymousPrivate
				]
				const rejectedPastes = await db
					.select({ id: pastesTable.id })
					.from(pastesTable)
					.where(inArray(pastesTable.slug, rejectedSlugs))
				const createdTags = await db
					.select({ id: tagsTable.id })
					.from(tagsTable)
					.where(inArray(tagsTable.name, rejectedTags))
				const pasteRelations = await db
					.select({ id: pasteTagsTable.id })
					.from(pasteTagsTable)
					.innerJoin(
						pastesTable,
						eq(pasteTagsTable.pasteId, pastesTable.id)
					)
					.where(inArray(pastesTable.slug, rejectedSlugs))
				const tagRelations = await db
					.select({ id: pasteTagsTable.id })
					.from(pasteTagsTable)
					.innerJoin(
						tagsTable,
						eq(pasteTagsTable.tagId, tagsTable.id)
					)
					.where(inArray(tagsTable.name, rejectedTags))

				strictEqual(rejectedPastes.length, 0)
				strictEqual(createdTags.length, 0)
				strictEqual(pasteRelations.length, 0)
				strictEqual(tagRelations.length, 0)
			}
		)

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
							content: protectedContent,
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

		await t.test('expired paste is rejected by details and verify', async () => {
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
		})

		await t.test(
			'GET download rejects a password query without hits or burn',
			async () => {
				await db
					.update(pastesTable)
					.set({ hits: 0 })
					.where(eq(pastesTable.id, burnProtected.id))

				const suppliedPassword = 'burn-password'
				const response = await app.request(
					`/api/pastes/${slugs.burnProtected}/download?password=${suppliedPassword}`
				)
				const body = await response.text()

				strictEqual(response.status, 400)
				strictEqual(body.includes(suppliedPassword), false)
				strictEqual(body.includes(`content-${slugs.burnProtected}`), false)
				strictEqual(body.includes('passwordHash'), false)

				const missingPasteResponse = await app.request(
					`/api/pastes/missing-${suffix}/download?password=${suppliedPassword}`
				)
				strictEqual(missingPasteResponse.status, 400)

				const [burnRow] = await db
					.select({ id: pastesTable.id, hits: pastesTable.hits })
					.from(pastesTable)
					.where(eq(pastesTable.id, burnProtected.id))
				ok(burnRow)
				strictEqual(burnRow.hits, 0)
			}
		)

		await t.test(
			'POST download rejects wrong and missing passwords without hits or burn',
			async () => {
				await db
					.update(pastesTable)
					.set({ hits: 0 })
					.where(eq(pastesTable.id, burnProtected.id))
				await db
					.update(pastesTable)
					.set({ hits: 0 })
					.where(eq(pastesTable.id, publicProtected.id))
				await db
					.update(pastesTable)
					.set({ hits: 0 })
					.where(eq(pastesTable.id, publicPlain.id))

				const wrongPassword = 'wrong-password-must-not-leak'
				const wrongResponse = await app.request(
					`/api/pastes/${slugs.burnProtected}/download`,
					{
						method: 'POST',
						headers: jsonHeaders(),
						body: JSON.stringify({ password: wrongPassword })
					}
				)
				const wrongBody = await wrongResponse.text()
				strictEqual(wrongResponse.status, 403)
				strictEqual(wrongBody.includes(wrongPassword), false)
				strictEqual(wrongBody.includes('passwordHash'), false)
				strictEqual(
					wrongBody.includes(`content-${slugs.burnProtected}`),
					false
				)

				const missingGetPasswordResponse = await app.request(
					`/api/pastes/${slugs.publicProtected}/download`
				)
				strictEqual(missingGetPasswordResponse.status, 401)

				const noBodyResponse = await app.request(
					`/api/pastes/${slugs.publicProtected}/download`,
					{
						method: 'POST',
						headers: jsonHeaders()
					}
				)
				strictEqual(noBodyResponse.status, 400)

				const malformedBodyResponse = await app.request(
					`/api/pastes/${slugs.publicProtected}/download`,
					{
						method: 'POST',
						headers: jsonHeaders(),
						body: '{'
					}
				)
				strictEqual(malformedBodyResponse.status, 400)

				const missingPasswordResponse = await app.request(
					`/api/pastes/${slugs.publicProtected}/download`,
					{
						method: 'POST',
						headers: jsonHeaders(),
						body: JSON.stringify({})
					}
				)
				strictEqual(missingPasswordResponse.status, 400)

				const unnecessaryPasswordResponse = await app.request(
					`/api/pastes/${slugs.publicPlain}/download`,
					{
						method: 'POST',
						headers: jsonHeaders(),
						body: JSON.stringify({ password: 'not-needed' })
					}
				)
				strictEqual(unnecessaryPasswordResponse.status, 400)

				const [burnRow] = await db
					.select({ id: pastesTable.id, hits: pastesTable.hits })
					.from(pastesTable)
					.where(eq(pastesTable.id, burnProtected.id))
				ok(burnRow)
				strictEqual(burnRow.hits, 0)

				const [protectedRow] = await db
					.select({ hits: pastesTable.hits })
					.from(pastesTable)
					.where(eq(pastesTable.id, publicProtected.id))
				const [plainRow] = await db
					.select({ hits: pastesTable.hits })
					.from(pastesTable)
					.where(eq(pastesTable.id, publicPlain.id))
				strictEqual(protectedRow.hits, 0)
				strictEqual(plainRow.hits, 0)
			}
		)

		await t.test(
			'POST download returns protected UTF-8 content and increments once',
			async () => {
				await db
					.update(pastesTable)
					.set({ hits: 41 })
					.where(eq(pastesTable.id, publicProtected.id))

				const response = await app.request(
					`/api/pastes/${slugs.publicProtected}/download`,
					{
						method: 'POST',
						headers: jsonHeaders(),
						body: JSON.stringify({ password: 'correct-password' })
					}
				)
				const body = await response.text()

				strictEqual(response.status, 200)
				strictEqual(
					response.headers.get('content-type'),
					'text/plain; charset=utf-8'
				)
				strictEqual(
					response.headers.get('content-disposition'),
					`attachment; filename="Security_fixture_${slugs.publicProtected}.txt"`
				)
				strictEqual(response.headers.get('cache-control'), 'no-store')
				strictEqual(body, protectedContent)
				strictEqual(body.includes('passwordHash'), false)

				const [row] = await db
					.select({ hits: pastesTable.hits })
					.from(pastesTable)
					.where(eq(pastesTable.id, publicProtected.id))
				strictEqual(row.hits, 42)
			}
		)

		await t.test(
			'successful POST download preserves burn-after-read behavior',
			async () => {
				const response = await app.request(
					`/api/pastes/${slugs.burnProtected}/download`,
					{
						method: 'POST',
						headers: jsonHeaders(),
						body: JSON.stringify({ password: 'burn-password' })
					}
				)

				strictEqual(response.status, 200)
				strictEqual(
					await response.text(),
					`content-${slugs.burnProtected}`
				)

				const [burnRow] = await db
					.select({ id: pastesTable.id })
					.from(pastesTable)
					.where(eq(pastesTable.id, burnProtected.id))
				strictEqual(burnRow, undefined)
			}
		)

		await t.test(
			'POST download applies private and expiration policy before password',
			async () => {
				await db
					.update(pastesTable)
					.set({ hits: 0 })
					.where(eq(pastesTable.id, privateProtected.id))
				await db
					.update(pastesTable)
					.set({ hits: 0 })
					.where(eq(pastesTable.id, expired.id))

				const privateResponse = await app.request(
					`/api/pastes/${slugs.privateProtected}/download`,
					{
						method: 'POST',
						headers: jsonHeaders(),
						body: JSON.stringify({ password: 'private-password' })
					}
				)
				const privateBody = await privateResponse.text()
				strictEqual(privateResponse.status, 404)
				strictEqual(privateBody.includes('passwordHash'), false)

				const ownerResponse = await app.request(
					`/api/pastes/${slugs.privateProtected}/download`,
					{
						method: 'POST',
						headers: jsonHeaders(true),
						body: JSON.stringify({ password: 'private-password' })
					}
				)
				strictEqual(ownerResponse.status, 200)
				strictEqual(
					await ownerResponse.text(),
					`content-${slugs.privateProtected}`
				)

				const expiredResponse = await app.request(
					`/api/pastes/${slugs.expired}/download`,
					{
						method: 'POST',
						headers: jsonHeaders(),
						body: JSON.stringify({ password: 'expired-password' })
					}
				)
				const expiredBody = await expiredResponse.text()
				strictEqual(expiredResponse.status, 404)
				strictEqual(expiredBody.includes('passwordHash'), false)

				const [privateRow] = await db
					.select({ hits: pastesTable.hits })
					.from(pastesTable)
					.where(eq(pastesTable.id, privateProtected.id))
				const [expiredRow] = await db
					.select({ hits: pastesTable.hits })
					.from(pastesTable)
					.where(eq(pastesTable.id, expired.id))
				strictEqual(privateRow.hits, 1)
				strictEqual(expiredRow.hits, 0)
			}
		)

		await t.test(
			'GET download returns public content and increments once',
			async () => {
				await db
					.update(pastesTable)
					.set({ hits: 73 })
					.where(eq(pastesTable.id, publicPlain.id))

				const response = await app.request(
					`/api/pastes/${slugs.publicPlain}/download`
				)
				const body = await response.text()

				strictEqual(response.status, 200)
				strictEqual(
					response.headers.get('content-type'),
					'text/plain; charset=utf-8'
				)
				strictEqual(
					response.headers.get('content-disposition'),
					`attachment; filename="Security_fixture_${slugs.publicPlain}.txt"`
				)
				strictEqual(body, `content-${slugs.publicPlain}`)

				const [row] = await db
					.select({ hits: pastesTable.hits })
					.from(pastesTable)
					.where(eq(pastesTable.id, publicPlain.id))
				strictEqual(row.hits, 74)
			}
		)

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
