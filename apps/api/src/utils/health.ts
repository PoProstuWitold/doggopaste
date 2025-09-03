import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import { sql } from 'drizzle-orm'
import type { Context } from 'hono'

import { db } from '../db/index.js'

const cwd = process.cwd()
const path = process.env.DOCKER
	? '/app/package.json'
	: join(cwd, '..', '..', 'package.json')
const pkgUrl = pathToFileURL(path).href
const { default: pkg } = await import(pkgUrl, { with: { type: 'json' } })

export const health = async (c: Context) => {
	const t0 = Date.now()
	try {
		await db.execute(sql`select 1`)
		const latency = Date.now() - t0
		return c.json({
			status: 'ok',
			description: pkg.description,
			version: pkg.version,
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
			isDocker: Boolean(process.env.DOCKER),
			node: process.version,
			services: {
				postgres: {
					connected: true,
					latencyMs: latency
				}
			}
		})
	} catch (err) {
		return c.json(
			{
				status: 'degraded',
				description: pkg.description,
				version: pkg.version,
				uptime: process.uptime(),
				timestamp: new Date().toISOString(),
				isDocker: Boolean(process.env.DOCKER),
				node: process.version,
				services: {
					postgres: {
						connected: false,
						error: (err as Error).message
					}
				}
			},
			503
		)
	}
}
