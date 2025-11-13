// built-in or npm
import { serve } from '@hono/node-server'
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { openAPIRouteHandler } from 'hono-openapi'

// custom
import { seedSyntaxes } from './db/seed.js'
import { GenericException } from './exceptions/index.js'
import {
	errorHandler,
	initWebSockets,
	ipAddress,
	responseTime,
	wsMiddleware
} from './middlewares/index.js'
import folderRoutes from './routes/folders.js'
import pasteRoutes from './routes/pastes.js'
import pasteRealtimeRoutes from './routes/pastes-realtime.js'
import userRoutes from './routes/user.js'
import type { Env } from './types'
import { origins } from './utils/contants.js'
import { health } from './utils/health.js'
import { auth, openApiSpec } from './utils/index.js'

if (!process.env.APP_URL) {
	throw new Error('APP_URL is required')
}

if (!process.env.APP_LAN) {
	throw new Error('APP_LAN is required')
}

await seedSyntaxes()

const app = new Hono<Env>().basePath('/api')
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
app.use(compress())
app.use(
	'*',
	cors({
		origin: origins,
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
		allowHeaders: ['Content-Type', 'Authorization'],
		exposeHeaders: ['Content-Type'],
		credentials: true,
		maxAge: 6000
	})
)
app.use(logger())
app.use(
	prettyJSON({
		space: 4,
		query: 'pretty'
	})
)
app.use('*', requestId())
app.use('*', secureHeaders())
app.use(wsMiddleware)
app.use(ipAddress)
app.get('/openapi', openAPIRouteHandler(app, openApiSpec))
app.get(
	'/docs',
	Scalar({
		theme: 'kepler',
		url: '/api/openapi',
		layout: 'modern',
		defaultHttpClient: {
			targetKey: 'js',
			clientKey: 'fetch'
		}
	})
)
app.get('/health', health)
app.onError(errorHandler)
app.notFound((c) => {
	throw new GenericException({
		name: 'Not Found',
		statusCode: 404,
		message: 'Route not found',
		details: [
			{
				route: `${c.req.method} ${c.req.path} doesn't exist`
			}
		]
	})
})
app.use(responseTime)

app.get('/', (c) => {
	c.var.io.emit('message', 'Hello from DoggoPaste REST API')
	return c.text('DoggoPaste REST API')
})

// Better Auth
app.use('*', async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers })

	if (!session) {
		c.set('user', null)
		c.set('session', null)
		return next()
	}

	c.set('user', session.user)
	c.set('session', session.session)
	return next()
})
app.on(['POST', 'GET'], '/auth/**', (c) => auth.handler(c.req.raw))
app.on('GET', '/redirect', (c) => c.redirect(`${process.env.APP_URL}/profile`))
// Routes
app.route('/pastes', pasteRoutes)
app.route('/pastes-realtime', pasteRealtimeRoutes)
app.route('/user', userRoutes)
app.route('/folders', folderRoutes)
