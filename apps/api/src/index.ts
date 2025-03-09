// built-in or npm
import { serve } from '@hono/node-server'
import { apiReference } from '@scalar/hono-api-reference'
import { Hono } from 'hono'
import { openAPISpecs } from 'hono-openapi'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'

// custom
import { GenericException } from './exceptions/index.js'
import {
	errorHandler,
	initWebSockets,
	responseTime,
	wsMiddleware
} from './middlewares/index.js'
import type { Env } from './types'
import { auth, openApiSpec } from './utils/index.js'

const app = new Hono<Env>().basePath('/api')
const server = serve(
	{
		fetch: app.fetch,
		port: 3001
	},
	(info) => {
		console.log(
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
		origin: 'http://localhost:3000',
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
app.get('/openapi', openAPISpecs(app, openApiSpec))
app.get(
	'/docs',
	apiReference({
		theme: 'saturn',
		spec: {
			url: '/api/openapi'
		}
	})
)
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
	c.var.io.emit('data', 'hello world')
	return c.text('DoggoPaste REST API')
})
app.on(['POST', 'GET'], '/auth/**', (c) => auth.handler(c.req.raw))
app.on('GET', '/redirect', (c) => c.redirect('http://localhost:3000/profile'))
