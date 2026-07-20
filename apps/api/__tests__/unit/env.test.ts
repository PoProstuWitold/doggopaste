// biome-ignore-all lint: test files
import { match, strictEqual, throws } from 'node:assert'
import test from 'node:test'
import { parseAuthEnvironment } from '../../src/utils/env.js'

test('parseAuthEnvironment()', async (t) => {
	await t.test('accepts password-only authentication configuration', () => {
		const environment = parseAuthEnvironment({
			NODE_ENV: 'production',
			APP_URL: 'https://doggopaste.example',
			BETTER_AUTH_SECRET: 'a'.repeat(32)
		})

		strictEqual(environment.NODE_ENV, 'production')
		strictEqual(environment.GITHUB_CLIENT_ID, undefined)
	})

	await t.test('requires GitHub credentials as a pair', () => {
		throws(
			() =>
				parseAuthEnvironment({
					NODE_ENV: 'production',
					APP_URL: 'https://doggopaste.example',
					BETTER_AUTH_SECRET: 'a'.repeat(32),
					GITHUB_CLIENT_ID: 'client-id'
				}),
			(error: Error) => {
				match(error.message, /GITHUB_CLIENT_SECRET/)
				strictEqual(error.message.includes('client-id'), false)
				return true
			}
		)
	})

	await t.test('treats blank GitHub credentials as disabled', () => {
		const environment = parseAuthEnvironment({
			NODE_ENV: 'development',
			APP_URL: 'http://localhost:3001',
			BETTER_AUTH_SECRET: 'a'.repeat(32),
			GITHUB_CLIENT_ID: ' ',
			GITHUB_CLIENT_SECRET: ''
		})

		strictEqual(environment.GITHUB_CLIENT_ID, undefined)
		strictEqual(environment.GITHUB_CLIENT_SECRET, undefined)
	})

	await t.test('preserves a complete GitHub credentials pair', () => {
		const environment = parseAuthEnvironment({
			NODE_ENV: 'production',
			APP_URL: 'https://doggopaste.example',
			BETTER_AUTH_SECRET: 'a'.repeat(32),
			GITHUB_CLIENT_ID: 'client-id',
			GITHUB_CLIENT_SECRET: 'client-secret'
		})

		strictEqual(environment.GITHUB_CLIENT_ID, 'client-id')
		strictEqual(environment.GITHUB_CLIENT_SECRET, 'client-secret')
	})

	await t.test('requires an explicit known Node environment', () => {
		for (const NODE_ENV of [undefined, 'prod']) {
			throws(
				() =>
					parseAuthEnvironment({
						NODE_ENV,
						APP_URL: 'https://doggopaste.example',
						BETTER_AUTH_SECRET: 'a'.repeat(32)
					}),
				/NODE_ENV/
			)
		}
	})

	await t.test('accepts only HTTP or HTTPS application URLs', () => {
		throws(
			() =>
				parseAuthEnvironment({
					NODE_ENV: 'production',
					APP_URL: 'ftp://doggopaste.example',
					BETTER_AUTH_SECRET: 'a'.repeat(32)
				}),
			/APP_URL/
		)
	})

	await t.test('rejects an invalid cookie domain', () => {
		throws(
			() =>
				parseAuthEnvironment({
					NODE_ENV: 'production',
					APP_URL: 'https://doggopaste.example',
					BETTER_AUTH_SECRET: 'a'.repeat(32),
					COOKIE_DOMAIN: 'bad domain'
				}),
			/COOKIE_DOMAIN/
		)
	})

	await t.test('reports field names without secret values', () => {
		const shortSecret = 'sensitive-value'

		throws(
			() =>
				parseAuthEnvironment({
					NODE_ENV: 'production',
					APP_URL: 'not-a-url',
					BETTER_AUTH_SECRET: shortSecret
				}),
			(error: Error) => {
				match(error.message, /APP_URL/)
				match(error.message, /BETTER_AUTH_SECRET/)
				strictEqual(error.message.includes(shortSecret), false)
				return true
			}
		)
	})
})
