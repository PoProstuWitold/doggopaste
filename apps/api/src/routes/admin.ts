import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/index.js'
import {
	pastesTable,
	realTimePastesTable,
	syntaxesTable,
	tagsTable,
	usersTable
} from '../db/schema.js'
import { adminGuard } from '../middlewares/admin-guard.js'
import { userGuard } from '../middlewares/user-guard.js'
import type { Env } from '../types.js'

const app = new Hono<Env>()
	.get('/pastes', userGuard, adminGuard, async (c) => {
		const pastes = await db
			.select({
				paste: {
					id: pastesTable.id,
					title: pastesTable.title,
					slug: pastesTable.slug,
					visibility: pastesTable.visibility,
					createdAt: pastesTable.createdAt,
					updatedAt: pastesTable.updatedAt
				},
				user: {
					id: usersTable.id,
					name: usersTable.name
				},
				syntax: {
					id: syntaxesTable.id,
					name: syntaxesTable.name,
					extension: syntaxesTable.extension,
					color: syntaxesTable.color
				}
			})
			.from(pastesTable)
			.leftJoin(syntaxesTable, eq(pastesTable.syntaxId, syntaxesTable.id))
			.leftJoin(usersTable, eq(pastesTable.userId, usersTable.id))

		return c.json({
			success: true,
			data: {
				pastes: pastes
			}
		})
	})
	.get('/pastes-realtime', userGuard, adminGuard, async (c) => {
		const realtimePastes = await db
			.select({
				paste: realTimePastesTable,
				syntax: {
					name: syntaxesTable.name,
					extension: syntaxesTable.extension,
					color: syntaxesTable.color
				}
			})
			.from(realTimePastesTable)
			.leftJoin(
				syntaxesTable,
				eq(realTimePastesTable.syntaxId, syntaxesTable.id)
			)

		return c.json({
			success: true,
			data: {
				realtimePastes: realtimePastes
			}
		})
	})
	.get('/tags', userGuard, adminGuard, async (c) => {
		const tags = await db
			.select({
				id: tagsTable.id,
				name: tagsTable.name
			})
			.from(tagsTable)

		return c.json({
			success: true,
			data: {
				tags: tags
			}
		})
	})
	.get('/syntaxes', userGuard, adminGuard, async (c) => {
		const syntaxes = await db
			.select({
				id: syntaxesTable.id,
				name: syntaxesTable.name,
				extension: syntaxesTable.extension,
				color: syntaxesTable.color
			})
			.from(syntaxesTable)

		return c.json({
			success: true,
			data: {
				syntaxes: syntaxes
			}
		})
	})

export type AppType = typeof app
export default app
