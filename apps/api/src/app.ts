// built-in or npm
import { Scalar } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { openAPIRouteHandler } from 'hono-openapi'

// custom
import { GenericException } from './exceptions/index.js'
import {
	errorHandler,
	ipAddress,
	responseTime,
	wsMiddleware
} from './middlewares/index.js'
import adminRoutes from './routes/admin.js'
import folderRoutes from './routes/folders.js'
import pasteRoutes from './routes/pastes.js'
import pasteRealtimeRoutes from './routes/pastes-realtime.js'
import userRoutes from './routes/user.js'
import type { Env } from './types'
import { origins } from './utils/contants.js'
import { health } from './utils/health.js'
import { auth, openApiSpec } from './utils/index.js'
import { REQUEST_LIMITS } from './utils/request-limits.js'

export function createApp() {
	const app = new Hono<Env>().basePath('/api')
	const isTest = process.env.NODE_ENV === 'test'

	// Global Middlewares
	app.use(compress())
	app.use(
		'*',
		cors({
			origin: origins,
			allowMethods: [
				'GET',
				'POST',
				'PUT',
				'PATCH',
				'DELETE',
				'OPTIONS',
				'HEAD'
			],
			allowHeaders: ['Content-Type', 'Authorization'],
			exposeHeaders: ['Content-Type', 'Retry-After'],
			credentials: true,
			maxAge: 6000
		})
	)
	app.use(
		'*',
		bodyLimit({
			maxSize: REQUEST_LIMITS.jsonBodyBytes,
			onError: (c) =>
				c.json(
					{
						statusCode: 413,
						name: 'Payload Too Large',
						message: 'Request body is too large'
					},
					413
				)
		})
	)
	app.use(
		prettyJSON({
			space: 4,
			query: 'pretty'
		})
	)
	app.use('*', requestId())
	app.use('*', secureHeaders())
	app.use(responseTime)

	// WebSockets & IP Address Middleware (disabled during tests)
	if (!isTest) {
		app.use(
			logger((message, ...rest) => {
				const sanitizedMessage = message
					.replace(/\?\S*/u, '')
					.replace(
						/(\/api\/auth\/reset-password\/)[^\s/]+/u,
						'$1[redacted]'
					)
				console.info(sanitizedMessage, ...rest)
			})
		)
		app.use(wsMiddleware)
		app.use(ipAddress)
	}

	// Basic Route, Health Check & Docs
	app.get('/', (c) => {
		const io = c.var.io
		if (io) {
			io.emit('message', 'Hello from DoggoPaste REST API')
		}
		return c.text('DoggoPaste REST API')
	})
	app.get('/health', health)
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

	// Error Handling
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

	// Better Auth
	app.use('*', async (c, next) => {
		if (c.req.path.startsWith('/api/auth/')) {
			c.set('user', null)
			c.set('session', null)
			return next()
		}

		const session = await auth.api.getSession({
			headers: c.req.raw.headers
		})

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
	app.on('GET', '/redirect', (c) =>
		c.redirect(`${process.env.APP_URL}/profile`)
	)

	// Routes
	app.route('/pastes', pasteRoutes)
	app.route('/pastes-realtime', pasteRealtimeRoutes)
	app.route('/user', userRoutes)
	app.route('/folders', folderRoutes)
	app.route('/admin', adminRoutes)

	return app
}
