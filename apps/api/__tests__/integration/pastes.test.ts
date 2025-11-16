// biome-ignore-all lint: test files
import { strictEqual } from 'node:assert'
import test from 'node:test'
import { getTestApp, prepareDb } from '../test-utils.js'

test(
	'PASTES: /api/pastes',
	{
		concurrency: false
	},
	async (t) => {
		await prepareDb()
		const app = getTestApp()
		let createdSlug: string | null = null
		const pasteContent = 'console.log("hello from tests")'

		await t.test('GET /', async () => {
			const res = await app.request('/api/pastes')
			const json: any = await res.json()

			strictEqual(res.status, 200)
			strictEqual(json.success, true)
			strictEqual(Array.isArray(json.data), true)
		})

		await t.test('POST / (guest paste)', async () => {
			const body = {
				title: 'Guest paste from tests',
				slug: '',
				description: 'Integration test guest paste',
				content: pasteContent,
				category: 'snippet',
				tags: ['test', 'guest'],
				syntax: 'Plaintext',
				expiration: 'never',
				visibility: 'public',
				folder: 'none',
				password: '',
				passwordEnabled: false,
				pasteAsGuest: true
			}

			const res = await app.request('/api/pastes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			})

			const json: any = await res.json()

			strictEqual(res.status, 201)
			strictEqual(json.success, true)
			strictEqual(json.data.userId, null)
			strictEqual(typeof json.data.slug, 'string')
			strictEqual(json.data.slug.length > 0, true)
			strictEqual(json.data.title, body.title)
			strictEqual(json.data.content, body.content)
			strictEqual(json.data.visibility, 'public')

			createdSlug = json.data.slug
		})

		await t.test('GET /:slug', async (t) => {
			await t.test('returns 404 for non-existing paste', async () => {
				const res = await app.request(
					'/api/pastes/non-existing-slug-xyz'
				)
				strictEqual(res.status, 404)
			})

			await t.test(
				'returns public guest paste without auth',
				async () => {
					if (!createdSlug) {
						throw new Error(
							'createdSlug is not set - POST / failed?'
						)
					}

					const res = await app.request(`/api/pastes/${createdSlug}`)
					const json: any = await res.json()

					strictEqual(res.status, 200)
					strictEqual(json.success, true)
					strictEqual(json.data.slug, createdSlug)
					strictEqual(json.data.title, 'Guest paste from tests')
					strictEqual(json.data.content, pasteContent)
					strictEqual(json.data.userId, null)
					strictEqual(json.data.visibility, 'public')
				}
			)
		})

		await t.test('GET /:slug/download', async (t) => {
			await t.test('returns 404 for non-existing paste', async () => {
				const res = await app.request(
					'/api/pastes/non-existing-slug-xyz/download'
				)
				strictEqual(res.status, 404)
			})

			await t.test(
				'downloads public guest paste as text without auth',
				async () => {
					if (!createdSlug) {
						throw new Error(
							'createdSlug is not set – POST / failed?'
						)
					}

					const res = await app.request(
						`/api/pastes/${createdSlug}/download`
					)

					strictEqual(res.status, 200)

					const contentType = res.headers.get('content-type') ?? ''
					const disposition =
						res.headers.get('content-disposition') ?? ''
					const body = await res.text()

					strictEqual(contentType.startsWith('text/plain'), true)
					strictEqual(disposition.includes('attachment;'), true)
					strictEqual(disposition.includes('.'), true)
					strictEqual(body, pasteContent)
				}
			)
		})
	}
)
