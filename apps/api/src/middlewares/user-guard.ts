import { createMiddleware } from 'hono/factory'
import { GenericException } from '../exceptions/index.js'
import type { Env } from '../types.js'

export const userGuard = createMiddleware<Env>(async (c, next) => {
	const user = c.get('user')

	if (!user) {
		throw new GenericException({
			statusCode: 401,
			name: 'Unauthorized',
			message: 'Not logged in'
		})
	}

	await next()
})
