import { zValidator } from '@hono/zod-validator'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db/index.js'
import {
	accountsTable,
	foldersTable,
	invitationsTable,
	membersTable,
	pastesTable,
	realTimePastesTable,
	sessionsTable,
	syntaxesTable,
	tagsTable,
	usersTable
} from '../db/schema.js'
import { GenericException } from '../exceptions/generic-exception.js'
import { adminGuard } from '../middlewares/admin-guard.js'
import { userGuard } from '../middlewares/user-guard.js'
import type { Env } from '../types.js'
import { DoggoUtils, validatorParamStringId } from '../utils/index.js'

const updateSyntaxSchema = z.object({
	name: z.string().min(1).max(64),
	extension: z.string().max(32).optional(),
	color: z.string().min(1).max(32)
})

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
	.delete(
		'/users/:id',
		userGuard,
		adminGuard,
		validatorParamStringId,
		async (c) => {
			const { id } = c.req.valid('param')
			const userId = id

			await db.delete(pastesTable).where(eq(pastesTable.userId, userId))
			await db.delete(foldersTable).where(eq(foldersTable.userId, userId))
			await db
				.delete(sessionsTable)
				.where(eq(sessionsTable.userId, userId))
			await db
				.delete(accountsTable)
				.where(eq(accountsTable.userId, userId))
			await db.delete(membersTable).where(eq(membersTable.userId, userId))
			await db
				.delete(invitationsTable)
				.where(eq(invitationsTable.inviterId, userId))

			await db.delete(usersTable).where(eq(usersTable.id, userId))

			await DoggoUtils.removeUnusedTags()

			return c.json({
				success: true,
				message: 'User and all associated data deleted'
			})
		}
	)
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
	.delete(
		'/pastes/:id',
		userGuard,
		adminGuard,
		validatorParamStringId,
		async (c) => {
			const { id } = c.req.valid('param')
			await db.delete(pastesTable).where(eq(pastesTable.id, id))
			await DoggoUtils.removeUnusedTags()
			return c.json({ success: true, message: 'Paste deleted' })
		}
	)
	.delete(
		'/pastes-realtime/:id',
		userGuard,
		adminGuard,
		validatorParamStringId,
		async (c) => {
			const { id } = c.req.valid('param')
			await db
				.delete(realTimePastesTable)
				.where(eq(realTimePastesTable.id, id))
			return c.json({ success: true, message: 'Realtime paste deleted' })
		}
	)
	.delete(
		'/tags/:id',
		userGuard,
		adminGuard,
		validatorParamStringId,
		async (c) => {
			const { id } = c.req.valid('param')
			await db.delete(tagsTable).where(eq(tagsTable.id, id))
			return c.json({ success: true, message: 'Tag deleted' })
		}
	)
	.put(
		'/syntaxes/:id',
		userGuard,
		adminGuard,
		validatorParamStringId,
		zValidator('json', updateSyntaxSchema, async (result, _c) => {
			if (!result.success) {
				throw new GenericException({
					statusCode: 400,
					name: 'Bad Request',
					message: 'Invalid syntax data'
				})
			}
		}),
		async (c) => {
			const { id } = c.req.valid('param')
			const { name, extension, color } = c.req.valid('json')

			try {
				await db
					.update(syntaxesTable)
					.set({ name, extension, color })
					.where(eq(syntaxesTable.id, id))
			} catch (_e) {
				throw new GenericException({
					statusCode: 409,
					name: 'Conflict',
					message: 'Syntax name already exists'
				})
			}

			return c.json({ success: true, message: 'Syntax updated' })
		}
	)

export type AppType = typeof app
export default app
