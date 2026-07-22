// biome-ignore-all lint: test files
import * as argon2 from 'argon2'
import { randomUUID } from 'node:crypto'
import { ok, strictEqual } from 'node:assert'
import test from 'node:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import { pastesTable, syntaxesTable } from '../../src/db/schema.js'
import { REQUEST_LIMITS, REST_RATE_LIMITS } from '../../src/utils/request-limits.js'
import { getTestApp, prepareDb } from '../test-utils.js'

function requestHeaders(ip: string) {
	return {
		'Content-Type': 'application/json',
		'X-Forwarded-For': ip
	}
}

function createPayload(slug: string) {
	return {
		title: 'REST limit fixture',
		slug,
		description: '',
		content: 'limited content',
		category: 'snippet',
		tags: [],
		syntax: 'Plaintext',
		expiration: 'never',
		visibility: 'public',
		folder: 'none',
		password: '',
		passwordEnabled: false,
		pasteAsGuest: true,
		encrypted: false
	}
}

test(
	'REST request and Argon2 limits',
	{ concurrency: false },
	async (t) => {
		await prepareDb()
		const app = getTestApp()
		const suffix = randomUUID().slice(0, 8)
		const cleanupSlugs: string[] = []

		const [plaintext] = await db
			.select({ id: syntaxesTable.id })
			.from(syntaxesTable)
			.where(eq(syntaxesTable.name, 'Plaintext'))
		ok(plaintext)

		const protectedSlug = `rest-protected-${suffix}`
		const burnSlug = `rest-burn-${suffix}`
		cleanupSlugs.push(protectedSlug, burnSlug)
		const passwordHash = await argon2.hash('correct-password')

		await db.insert(pastesTable).values([
			{
				title: 'Protected REST fixture',
				slug: protectedSlug,
				content: 'protected content',
				syntaxId: plaintext.id,
				passwordHash,
				visibility: 'public',
				expiration: 'never'
			},
			{
				title: 'Burn REST fixture',
				slug: burnSlug,
				content: 'burn content',
				syntaxId: plaintext.id,
				passwordHash,
				visibility: 'public',
				expiration: 'burn_after_read'
			}
		])

		t.after(async () => {
			await db
				.delete(pastesTable)
				.where(inArray(pastesTable.slug, cleanupSlugs))
		})

		await t.test(
			'normal verify and protected download work before the shared limit',
			async () => {
				const ip = '198.51.100.10'
				const verifyResponse = await app.request(
					`/api/pastes/${protectedSlug}/verify`,
					{
						method: 'POST',
						headers: requestHeaders(ip),
						body: JSON.stringify({ password: 'correct-password' })
					}
				)
				strictEqual(verifyResponse.status, 200)
				strictEqual(
					((await verifyResponse.json()) as { content: string }).content,
					'protected content'
				)

				const downloadResponse = await app.request(
					`/api/pastes/${protectedSlug}/download`,
					{
						method: 'POST',
						headers: requestHeaders(ip),
						body: JSON.stringify({ password: 'correct-password' })
					}
				)
				strictEqual(downloadResponse.status, 200)
				strictEqual(await downloadResponse.text(), 'protected content')

				for (
					let attempt = 2;
					attempt < REST_RATE_LIMITS.passwordVerify.max;
					attempt += 1
				) {
					const response = await app.request(
						`/api/pastes/${protectedSlug}/verify`,
						{
							method: 'POST',
							headers: requestHeaders(ip),
							body: JSON.stringify({ password: 'wrong-password' })
						}
					)
					strictEqual(response.status, 403)
				}

				const limitedResponse = await app.request(
					`/api/pastes/${protectedSlug}/download`,
					{
						method: 'POST',
						headers: requestHeaders(ip),
						body: JSON.stringify({ password: 'wrong-password' })
					}
				)
				strictEqual(limitedResponse.status, 429)
				const retryAfter = Number(
					limitedResponse.headers.get('retry-after')
				)
				strictEqual(Number.isInteger(retryAfter), true)
				strictEqual(retryAfter >= 1, true)
				strictEqual(retryAfter <= 60, true)

				const [paste] = await db
					.select({ hits: pastesTable.hits })
					.from(pastesTable)
					.where(eq(pastesTable.slug, protectedSlug))
				strictEqual(paste.hits, 2)
			}
		)

		await t.test(
			'an overlong password is rejected before burn or hits',
			async () => {
				const response = await app.request(
					`/api/pastes/${burnSlug}/verify`,
					{
						method: 'POST',
						headers: requestHeaders('198.51.100.11'),
						body: JSON.stringify({
							password: 'x'.repeat(REQUEST_LIMITS.paste.password + 1)
						})
					}
				)

				strictEqual(response.status, 400)
				const [paste] = await db
					.select({ id: pastesTable.id, hits: pastesTable.hits })
					.from(pastesTable)
					.where(eq(pastesTable.slug, burnSlug))
				ok(paste)
				strictEqual(paste.hits, 0)
			}
		)

		await t.test('paste field limits reject invalid requests', async () => {
			const cases = [
				{
					name: 'content',
					payload: {
						...createPayload(`rest-content-${suffix}`),
						content: 'x'.repeat(REQUEST_LIMITS.paste.content + 1)
					}
				},
				{
					name: 'tags',
					payload: {
						...createPayload(`rest-tags-${suffix}`),
						tags: Array.from(
							{ length: REQUEST_LIMITS.paste.tags + 1 },
							(_, index) => `tag${index}`
						)
					}
				},
				{
					name: 'syntax',
					payload: {
						...createPayload(`rest-syntax-${suffix}`),
						syntax: 'x'.repeat(REQUEST_LIMITS.paste.syntax + 1)
					}
				},
				{
					name: 'password',
					payload: {
						...createPayload(`rest-password-${suffix}`),
						passwordEnabled: true,
						password: 'x'.repeat(REQUEST_LIMITS.paste.password + 1)
					}
				}
			]

			for (const { name, payload } of cases) {
				const response = await app.request('/api/pastes', {
					method: 'POST',
					headers: requestHeaders('198.51.100.12'),
					body: JSON.stringify(payload)
				})
				strictEqual(response.status, 400, name)
			}
		})

		await t.test('an oversized request body receives JSON 413', async () => {
			const oversizedSlug = `rest-body-${suffix}`
			const response = await app.request('/api/pastes', {
				method: 'POST',
				headers: requestHeaders('198.51.100.13'),
				body: JSON.stringify({
					...createPayload(oversizedSlug),
					content: 'x'.repeat(REQUEST_LIMITS.jsonBodyBytes + 1)
				})
			})

			strictEqual(response.status, 413)
			const body = (await response.json()) as {
				statusCode: number
				name: string
			}
			strictEqual(body.statusCode, 413)
			strictEqual(body.name, 'Payload Too Large')

			const [paste] = await db
				.select({ id: pastesTable.id })
				.from(pastesTable)
				.where(eq(pastesTable.slug, oversizedSlug))
			strictEqual(paste, undefined)
		})

		await t.test('password hashes use their own bounded endpoint quota', async () => {
			const ip = '198.51.100.14'
			for (
				let attempt = 0;
				attempt < REST_RATE_LIMITS.passwordHash.max;
				attempt += 1
			) {
				const slug = `rest-hash-${attempt}-${suffix}`
				cleanupSlugs.push(slug)
				const response = await app.request('/api/pastes', {
					method: 'POST',
					headers: requestHeaders(ip),
					body: JSON.stringify({
						...createPayload(slug),
						passwordEnabled: true,
						password: 'create-password'
					})
				})
				strictEqual(response.status, 201, `attempt ${attempt + 1}`)
			}

			const limitedSlug = `rest-hash-limited-${suffix}`
			const limitedResponse = await app.request('/api/pastes', {
				method: 'POST',
				headers: requestHeaders(ip),
				body: JSON.stringify({
					...createPayload(limitedSlug),
					passwordEnabled: true,
					password: 'create-password'
				})
			})

			strictEqual(limitedResponse.status, 429)
			strictEqual(
				Number(limitedResponse.headers.get('retry-after')) >= 1,
				true
			)

			const [paste] = await db
				.select({ id: pastesTable.id })
				.from(pastesTable)
				.where(eq(pastesTable.slug, limitedSlug))
			strictEqual(paste, undefined)
		})
	}
)
