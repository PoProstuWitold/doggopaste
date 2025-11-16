// biome-ignore-all lint: test files
import { ok, strictEqual } from 'node:assert'
import test from 'node:test'
import { getTestApp, prepareDb } from '../test-utils.js'

test(
	'REALTIME PASTES: /api/pastes-realtime',
	{
		concurrency: true
	},
	async (t) => {
		await prepareDb()
		const app = getTestApp()
		const slug = `rt-test-${Date.now()}`
		const missingSlug = 'rt-missing-slug'

		await t.test('POST /:slug', async (t) => {
			await t.test(
				'creates new paste when it does not exist',
				async () => {
					const res = await app.request(
						`/api/pastes-realtime/${slug}`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({})
						}
					)

					strictEqual(res.status, 200)

					const json: any = await res.json()

					strictEqual(json.success, true)
					strictEqual(json.realtimePaste.slug, slug)
					strictEqual(json.realtimePaste.title, slug)
					strictEqual(json.realtimePaste.content, '')

					ok('syntax' in json.realtimePaste)
					strictEqual(json.session, null)
				}
			)

			await t.test(
				'returns existing paste on second call (same slug)',
				async () => {
					const res = await app.request(
						`/api/pastes-realtime/${slug}`,
						{
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({})
						}
					)

					strictEqual(res.status, 200)
				}
			)
		})

		await t.test('GET /:slug', async (t) => {
			await t.test('returns 404 for non-existing paste', async () => {
				const res = await app.request(
					`/api/pastes-realtime/${missingSlug}`
				)

				strictEqual(res.status, 404)
			})

			await t.test(
				'returns existing paste created via POST',
				async () => {
					const res = await app.request(
						`/api/pastes-realtime/${slug}`
					)

					strictEqual(res.status, 200)

					const json: any = await res.json()

					strictEqual(json.success, true)
					strictEqual(json.data.slug, slug)
					strictEqual(json.data.title, slug)
				}
			)
		})

		await t.test('GET /:slug/download', async (t) => {
			await t.test('returns 404 for non-existing paste', async () => {
				const res = await app.request(
					`/api/pastes-realtime/${missingSlug}/download`
				)

				strictEqual(res.status, 404)
			})

			await t.test(
				'returns text file with correct headers and content',
				async () => {
					const res = await app.request(
						`/api/pastes-realtime/${slug}/download`
					)

					strictEqual(res.status, 200)

					const contentType = res.headers.get('content-type') ?? ''
					const disposition =
						res.headers.get('content-disposition') ?? ''
					const body = await res.text()

					ok(contentType.startsWith('text/plain'))
					ok(disposition.includes('attachment;'))
					ok(disposition.includes(`${slug}.`))

					strictEqual(body, '')
				}
			)
		})
	}
)
