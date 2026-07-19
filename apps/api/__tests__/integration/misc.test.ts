// biome-ignore-all lint: test files
import { strictEqual } from 'node:assert'
import test from 'node:test'
import { Hono } from 'hono'
import { errorHandler } from '../../src/middlewares/error-handler.js'
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

		await t.test(
			'unknown server errors are logged without exposing details',
			async () => {
				const isolatedApp = new Hono()
				const internalError = new Error(
					'database relation internal_only does not exist'
				)
				isolatedApp.get('/failure', () => {
					throw internalError
				})
				isolatedApp.onError(errorHandler)

				const logged: unknown[][] = []
				const originalConsoleError = console.error
				console.error = (...args: unknown[]) => logged.push(args)

				try {
					const res = await isolatedApp.request('/failure')
					const json: any = await res.json()

					strictEqual(res.status, 500)
					strictEqual(json.statusCode, 500)
					strictEqual(json.name, 'Internal Server Error')
					strictEqual(json.message, 'Internal Server Error')
					strictEqual(JSON.stringify(json).includes('internal_only'), false)
					strictEqual(logged.some((args) => args.includes(internalError)), true)
				} finally {
					console.error = originalConsoleError
				}
			}
		)

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
			for (const [method, statuses] of [
				['get', ['200', '400', '401', '404']],
				['post', ['200', '400', '403', '404']]
			] as const) {
				for (const status of statuses) {
					strictEqual(
						download[method].responses[status].headers['Cache-Control']
							.schema.enum[0],
						'no-store'
					)
				}
			}
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
