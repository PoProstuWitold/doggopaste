// biome-ignore-all lint: test files
import { ok, strictEqual } from 'node:assert'
import test from 'node:test'
import { and, eq } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import { sessionsTable, usersTable } from '../../src/db/schema.js'
import { getTestApp, prepareDb } from '../test-utils.js'

test(
	'AUTH: tracks session IP from configured reverse-proxy headers',
	{ concurrency: false },
	async (t) => {
		await prepareDb()
		const app = getTestApp()
		const suffix = crypto.randomUUID().replaceAll('-', '')
		const email = `auth-ip-${suffix}@example.test`
		const password = 'test-password-123'

		t.after(async () => {
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
					name: `auth-ip-${suffix}`,
					email,
					password
				})
			}
		)
		strictEqual(signUpResponse.status, 200)
		const signUpJson = (await signUpResponse.json()) as {
			user: { id: string }
		}

		const [localSession] = await db
			.select({ ipAddress: sessionsTable.ipAddress })
			.from(sessionsTable)
			.where(eq(sessionsTable.userId, signUpJson.user.id))
		ok(localSession)
		strictEqual(localSession.ipAddress, '127.0.0.1')

		const forwardedIp = '203.0.113.42'
		const signInResponse = await app.request(
			'http://localhost:3001/api/auth/sign-in/email',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Origin: 'http://localhost:3001',
					'cf-connecting-ip': forwardedIp,
					'x-client-ip': '192.0.2.10',
					'x-forwarded-for': '198.51.100.7'
				},
				body: JSON.stringify({ email, password })
			}
		)
		strictEqual(signInResponse.status, 200)

		const [forwardedSession] = await db
			.select({ ipAddress: sessionsTable.ipAddress })
			.from(sessionsTable)
			.where(
				and(
					eq(sessionsTable.userId, signUpJson.user.id),
					eq(sessionsTable.ipAddress, forwardedIp)
				)
			)
		ok(forwardedSession)
		strictEqual(forwardedSession.ipAddress, forwardedIp)
	}
)
