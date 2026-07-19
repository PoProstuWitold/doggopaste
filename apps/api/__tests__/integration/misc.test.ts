// biome-ignore-all lint: test files
import { strictEqual } from 'node:assert'
import test from 'node:test'
import { getTestApp, prepareDb } from '../test-utils.js'

test(
	'MISC: /api',
	{
		concurrency: true
	},
	async (t) => {
		await prepareDb()
		const app = getTestApp()

		await t.test('GET /', async () => {
			const res = await app.request('/api')
			const text = await res.text()

			strictEqual(text, 'DoggoPaste REST API')
			strictEqual(res.status, 200)
		})

		await t.test('GET /health', async () => {
			const res = await app.request('/api/health')
			const json: any = await res.json()

			strictEqual(json.status, 'ok')
			strictEqual(res.status, 200)
		})

		await t.test('GET /openapi', async () => {
			const res = await app.request('/api/openapi')
			const spec: any = await res.json()
			const download = spec.paths['/pastes/{slug}/download']

			strictEqual(res.status, 200)
			strictEqual(
				download.post.requestBody.content['application/json'].schema
					.properties.password.type,
				'string'
			)
			strictEqual(download.post.requestBody.required, true)
			strictEqual(
				download.get.responses['200'].content[
					'text/plain; charset=utf-8'
				].schema.type,
				'string'
			)
			strictEqual(
				download.get.responses['200'].headers['Content-Disposition']
					.required,
				true
			)
			strictEqual(download.get.responses['400'].description.length > 0, true)
			strictEqual(download.get.responses['401'].description.length > 0, true)
			strictEqual(download.get.responses['404'].description.length > 0, true)
			strictEqual(
				download.post.responses['200'].headers['Cache-Control'].schema
					.enum[0],
				'no-store'
			)
			strictEqual(download.post.responses['400'].description.length > 0, true)
			strictEqual(download.post.responses['403'].description.length > 0, true)
			strictEqual(download.post.responses['404'].description.length > 0, true)
		})

		await t.test('GET /api/docs', async () => {
			const res = await app.request('/api/docs')

			strictEqual(res.status, 200)
		})
	}
)
