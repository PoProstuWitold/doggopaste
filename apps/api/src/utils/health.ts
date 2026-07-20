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

type DatabaseHealthCheck = () => Promise<unknown>
type HealthErrorLogger = (message: string, error: unknown) => void

export function createHealthHandler(
	checkDatabase: DatabaseHealthCheck,
	logError: HealthErrorLogger = (message, error) =>
		console.error(message, error)
) {
	return async (c: Context) => {
		const t0 = Date.now()
		try {
			await checkDatabase()
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
			logError('Database health check failed', err)
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
							error: 'unavailable'
						}
					}
				},
				503
			)
		}
	}
}

export const health = createHealthHandler(() => db.execute(sql`select 1`))
