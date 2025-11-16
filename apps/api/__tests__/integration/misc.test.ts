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

			strictEqual(res.status, 200)
		})

		await t.test('GET /api/docs', async () => {
			const res = await app.request('/api/docs')

			strictEqual(res.status, 200)
		})
	}
)
