import { createApp } from '../src/app.js'
import { seedSyntaxes } from '../src/db/seed.js'

let appInstance: ReturnType<typeof createApp> | null = null

export function getTestApp() {
	if (!appInstance) {
		appInstance = createApp()
	}
	return appInstance
}

export async function prepareDb() {
	if (process.env.NODE_ENV !== 'test') {
		throw new Error('prepareDb should only be run in test environment')
	}
	await seedSyntaxes()
}
