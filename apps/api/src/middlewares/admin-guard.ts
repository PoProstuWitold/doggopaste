import { createMiddleware } from 'hono/factory'
import { GenericException } from '../exceptions/index.js'
import type { Env } from '../types.js'

export const adminGuard = createMiddleware<Env>(async (c, next) => {
	const user = c.get('user')
	const isAdmin = user.role === 'admin'

	if (!isAdmin) {
		throw new GenericException({
			statusCode: 403,
			name: 'Forbidden',
			message: 'Admin access required'
		})
	}

	await next()
})
