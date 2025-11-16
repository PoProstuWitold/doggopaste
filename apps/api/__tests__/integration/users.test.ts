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

		await t.test('GET /pastes?userId=anon-id', async (t) => {
			await t.test('returns 404 for non-existing user', async () => {
				const userId = 'anon-id'
				const res = await app.request(
					`/api/users/pastes?userId=${userId}`
				)

				strictEqual(res.status, 404)
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
