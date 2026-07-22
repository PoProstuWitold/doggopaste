// biome-ignore-all lint: test files
import { deepStrictEqual, ok, strictEqual } from 'node:assert'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { eq } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import {
	realTimePastesTable,
	syntaxesTable
} from '../../src/db/schema.js'
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

		await t.test(
			'rejects invalid slugs on every realtime HTTP endpoint',
			async () => {
				for (const invalidSlug of ['invalid_slug', 'a'.repeat(65)]) {
					for (const request of [
						{
							path: `/api/pastes-realtime/${invalidSlug}`,
							method: 'POST'
						},
						{
							path: `/api/pastes-realtime/${invalidSlug}`,
							method: 'GET'
						},
						{
							path: `/api/pastes-realtime/${invalidSlug}/download`,
							method: 'GET'
						}
					]) {
						const res = await app.request(request.path, {
							method: request.method
						})
						strictEqual(
							res.status,
							400,
							`${request.method} ${request.path}`
						)
					}
				}
			}
		)

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
					strictEqual(json.viewer, null)
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

			await t.test(
				'returns one paste for concurrent first requests',
				async () => {
					const raceSlug = `rt-race-${randomUUID().replaceAll('-', '')}`

					try {
						const request = () =>
							app.request(`/api/pastes-realtime/${raceSlug}`, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({})
							})
						const [firstRes, secondRes] = await Promise.all([
							request(),
							request()
						])

						strictEqual(firstRes.status, 200)
						strictEqual(secondRes.status, 200)

						const [firstJson, secondJson]: any[] = await Promise.all([
							firstRes.json(),
							secondRes.json()
						])
						strictEqual(
							firstJson.realtimePaste.id,
							secondJson.realtimePaste.id
						)
						strictEqual(firstJson.viewer, null)
						strictEqual(secondJson.viewer, null)

						const rows = await db
							.select({ id: realTimePastesTable.id })
							.from(realTimePastesTable)
							.where(eq(realTimePastesTable.slug, raceSlug))
						strictEqual(rows.length, 1)
					} finally {
						await db
							.delete(realTimePastesTable)
							.where(eq(realTimePastesTable.slug, raceSlug))
					}
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

		await t.test(
			'normalizes a missing syntax to Plaintext',
			async () => {
				await db
					.update(realTimePastesTable)
					.set({ syntaxId: null })
					.where(eq(realTimePastesTable.slug, slug))

				const createOrGetRes = await app.request(
					`/api/pastes-realtime/${slug}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({})
					}
				)
				strictEqual(createOrGetRes.status, 200)

				const createOrGetJson: any = await createOrGetRes.json()
				deepStrictEqual(createOrGetJson.realtimePaste.syntax, {
					name: 'Plaintext',
					extension: 'txt',
					color: '#808080'
				})

				const detailsRes = await app.request(
					`/api/pastes-realtime/${slug}`
				)
				strictEqual(detailsRes.status, 200)

				const detailsJson: any = await detailsRes.json()
				deepStrictEqual(detailsJson.data.syntax, {
					name: 'Plaintext',
					extension: 'txt',
					color: '#808080'
				})

				const downloadRes = await app.request(
					`/api/pastes-realtime/${slug}/download`
				)
				strictEqual(downloadRes.status, 200)
				ok(
					downloadRes.headers
						.get('content-disposition')
						?.includes(`${slug}.txt`)
				)
			}
		)

		await t.test(
			'uses txt when the syntax extension is empty',
			async () => {
				const [syntax] = await db
					.insert(syntaxesTable)
					.values({
						name: `Empty extension ${Date.now()}`,
						extension: '',
						color: '#808080'
					})
					.returning({ id: syntaxesTable.id })

				try {
					await db
						.update(realTimePastesTable)
						.set({ syntaxId: syntax.id })
						.where(eq(realTimePastesTable.slug, slug))

					const res = await app.request(
						`/api/pastes-realtime/${slug}/download`
					)

					strictEqual(res.status, 200)
					ok(
						res.headers
							.get('content-disposition')
							?.includes(`${slug}.txt`)
					)
				} finally {
					await db
						.update(realTimePastesTable)
						.set({ syntaxId: null })
						.where(eq(realTimePastesTable.slug, slug))
					await db
						.delete(syntaxesTable)
						.where(eq(syntaxesTable.id, syntax.id))
				}
			}
		)

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
