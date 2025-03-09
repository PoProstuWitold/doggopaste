import { getConnInfo } from '@hono/node-server/conninfo'
import type { Context, Next } from 'hono'

export const ipAddress = async (c: Context, next: Next) => {
	const info = getConnInfo(c)
	await next()
	c.res.headers.set('x-client-ip', `${info.remote.address}`)
}
