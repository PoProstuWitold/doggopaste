import type { Context, Next } from 'hono'

export const responseTime = async (c: Context, next: Next) => {
	const start = Date.now()
	await next()
	const end = Date.now()
	c.res.headers.set('X-Response-Time', `${end - start}ms`)
}
