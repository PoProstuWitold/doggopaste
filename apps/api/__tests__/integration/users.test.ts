// biome-ignore-all lint: test files
import { strictEqual } from 'node:assert'
import test from 'node:test'
import { getTestApp, prepareDb } from '../test-utils.js'

test(
	'USER: /api/user',
	{
		concurrency: true
	},
	async (t) => {
		await prepareDb()
		const app = getTestApp()

		await t.test('GET /api/user/pastes?userId=:userId', async (t) => {
			await t.test('returns an empty paste list for unknown owner', async () => {
				const userId = '00000000-0000-4000-8000-000000000000'
				const res = await app.request(
					`/api/user/pastes?userId=${userId}`
				)
				const json: any = await res.json()

				strictEqual(res.status, 200)
				strictEqual(json.success, true)
				strictEqual(Number(json.total), 0)
				strictEqual(Array.isArray(json.data), true)
				strictEqual(json.data.length, 0)
			})
		})

		await t.test('GET /name/:name', async (t) => {
			await t.test('returns 404 for non-existing user', async () => {
				const name = 'anon'
				const res = await app.request(`/api/user/name/${name}`)

				strictEqual(res.status, 404)
			})
		})
	}
)
