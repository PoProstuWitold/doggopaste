// built-in or npm
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { compress } from 'hono/compress'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'

// custom
import { GenericException } from './exceptions'
import {
	errorHandler,
	initWebSockets,
	responseTime,
	wsMiddleware
} from './middlewares'
import type { Env } from './types'
import { auth } from './utils'

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
	cors({
		origin: '*',
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']
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
