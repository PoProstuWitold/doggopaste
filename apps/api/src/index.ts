import { serve } from '@hono/node-server'
import { createApp } from './app.js'
import { seedSyntaxes } from './db/seed.js'
import { initWebSockets } from './middlewares/index.js'

await seedSyntaxes()

const app = createApp()

const server = serve(
	{
		fetch: app.fetch,
		port: 3001
	},
	(info) => {
		console.info(
			`REST API & WebSockets server is running on port ${info.port}. GLHF!`
		)
	}
)
initWebSockets(server)

export { app }
