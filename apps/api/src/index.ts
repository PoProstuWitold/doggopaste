import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { seedSyntaxes } from './db/seed.js'
import { initWebSockets } from './middlewares/index.js'

if (process.env.NODE_ENV !== 'test') {
	if (!process.env.APP_URL) {
		throw new Error('APP_URL is required')
	}

	if (!process.env.APP_LAN) {
		throw new Error('APP_LAN is required')
	}
}

await seedSyntaxes()

const app = createApp()

const server = serve(
	{
		fetch: app.fetch,
		port: 3001
	},
	(info) => {
		console.info(
			`Server is running at ${
				info.address === '::' ? 'localhost:' : info.address
			}${info.port} with ${info.family}. GLHF!`
		)
	}
)
initWebSockets(server)

export { app }
