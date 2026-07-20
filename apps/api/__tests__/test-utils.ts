import { createApp } from '../src/app.js'
import { seedSyntaxes } from '../src/db/seed.js'

let appInstance: ReturnType<typeof createApp> | null = null
let preparePromise: Promise<void> | null = null

function assertIsolatedTestDatabase() {
	if (process.env.NODE_ENV !== 'test') {
		throw new Error('Tests require NODE_ENV=test')
	}

	if (!process.env.DATABASE_URL) {
		throw new Error('Tests require an isolated DATABASE_URL')
	}

	let databaseName: string
	try {
		const databaseUrl = new URL(process.env.DATABASE_URL)
		if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
			throw new Error('unsupported protocol')
		}
		databaseName = decodeURIComponent(databaseUrl.pathname.slice(1))
	} catch {
		throw new Error('Tests require a valid PostgreSQL DATABASE_URL')
	}

	if (!/^doggopaste_test_[0-9]+_[a-f0-9]+$/u.test(databaseName)) {
		throw new Error('Tests refuse to use a non-isolated database')
	}

	if (databaseName !== process.env.DOGGOPASTE_TEST_DATABASE_NAME) {
		throw new Error('Tests require a runner-created database')
	}
}

export function getTestApp() {
	assertIsolatedTestDatabase()
	if (!appInstance) {
		appInstance = createApp()
	}
	return appInstance
}

export async function prepareDb() {
	assertIsolatedTestDatabase()
	preparePromise ??= seedSyntaxes()
	await preparePromise
}
