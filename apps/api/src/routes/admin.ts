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
import {
	activePasteCondition,
	DoggoUtils,
	toRealtimePasteDto,
	toSyntaxDto,
	validatorParamStringId
} from '../utils/index.js'

const updateSyntaxSchema = z.object({
	name: z.string().min(1).max(64),
	extension: z
		.string()
		.max(32)
		.refine(
			(value) =>
				value === '' || /^[a-z0-9]+(?:\.[a-z0-9]+)*$/i.test(value),
			'Extension must be empty or contain only letters, numbers, and dots between segments'
		)
		.nullable()
		.optional(),
	color: z.string().min(1).max(32)
})

function isUniqueViolation(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false

	const dbError = error as {
		code?: string
		cause?: { code?: string }
	}

	return dbError.code === '23505' || dbError.cause?.code === '23505'
}

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
			.where(activePasteCondition())

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
				realtimePastes: realtimePastes.map(({ paste, syntax }) => ({
					paste: toRealtimePasteDto(paste),
					syntax: syntax?.name
						? {
								name: syntax.name,
								extension: syntax.extension,
								color: syntax.color ?? '#808080'
							}
						: null
				}))
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

			await db.transaction(async (tx) => {
				await DoggoUtils.acquirePasteMutationLock(tx)

				const [existingUser] = await tx
					.select({ id: usersTable.id })
					.from(usersTable)
					.where(eq(usersTable.id, userId))
					.for('update')

				if (!existingUser) {
					throw new GenericException({
						statusCode: 404,
						name: 'Not Found',
						message: 'User not found'
					})
				}

				await tx
					.delete(pastesTable)
					.where(eq(pastesTable.userId, userId))
				await tx
					.delete(foldersTable)
					.where(eq(foldersTable.userId, userId))
				await tx
					.delete(sessionsTable)
					.where(eq(sessionsTable.userId, userId))
				await tx
					.delete(accountsTable)
					.where(eq(accountsTable.userId, userId))
				await tx
					.delete(membersTable)
					.where(eq(membersTable.userId, userId))
				await tx
					.delete(invitationsTable)
					.where(eq(invitationsTable.inviterId, userId))

				const [deletedUser] = await tx
					.delete(usersTable)
					.where(eq(usersTable.id, userId))
					.returning({ id: usersTable.id })

				if (!deletedUser) {
					throw new Error('User disappeared during deletion')
				}

				await DoggoUtils.removeUnusedTags(tx)
			})

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
				syntaxes: syntaxes.map(toSyntaxDto)
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
			await db.transaction(async (tx) => {
				await DoggoUtils.acquirePasteMutationLock(tx)
				const [deletedPaste] = await tx
					.delete(pastesTable)
					.where(eq(pastesTable.id, id))
					.returning({ id: pastesTable.id })

				if (!deletedPaste) {
					throw new GenericException({
						statusCode: 404,
						name: 'Not Found',
						message: 'Paste not found'
					})
				}

				await DoggoUtils.removeUnusedTags(tx)
			})
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
			const [deletedPaste] = await db
				.delete(realTimePastesTable)
				.where(eq(realTimePastesTable.id, id))
				.returning({ id: realTimePastesTable.id })

			if (!deletedPaste) {
				throw new GenericException({
					statusCode: 404,
					name: 'Not Found',
					message: 'Realtime paste not found'
				})
			}

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
			await db.transaction(async (tx) => {
				await DoggoUtils.acquirePasteMutationLock(tx)
				const [deletedTag] = await tx
					.delete(tagsTable)
					.where(eq(tagsTable.id, id))
					.returning({ id: tagsTable.id })

				if (!deletedTag) {
					throw new GenericException({
						statusCode: 404,
						name: 'Not Found',
						message: 'Tag not found'
					})
				}
			})

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

			let updatedSyntax: { id: string } | undefined

			try {
				const updatedRows = await db
					.update(syntaxesTable)
					.set({ name, extension, color })
					.where(eq(syntaxesTable.id, id))
					.returning({ id: syntaxesTable.id })
				updatedSyntax = updatedRows[0]
			} catch (error) {
				if (isUniqueViolation(error)) {
					throw new GenericException({
						statusCode: 409,
						name: 'Conflict',
						message: 'Syntax name already exists'
					})
				}

				throw error
			}

			if (!updatedSyntax) {
				throw new GenericException({
					statusCode: 404,
					name: 'Not Found',
					message: 'Syntax not found'
				})
			}

			return c.json({ success: true, message: 'Syntax updated' })
		}
	)

export type AppType = typeof app
export default app
