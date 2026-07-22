import * as argon2 from 'argon2'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { type Context, Hono } from 'hono'
import { db } from '../db/index.js'
import {
	foldersTable,
	pastesTable,
	pasteTagsTable,
	syntaxesTable,
	tagsTable
} from '../db/schema.js'
import { GenericException } from '../exceptions/generic-exception.js'
import { userGuard } from '../middlewares/user-guard.js'
import type { Env } from '../types.js'
import {
	activePasteCondition,
	authorizePasteRead,
	DoggoUtils,
	type PasteSummaryDto,
	pasteDetailsSelection,
	pasteRecordToDetailsSource,
	pasteSummarySelection,
	throwPasteNotFound,
	toPasteDetailsDto,
	toPasteSummaryDto,
	validatorCreatePasteJson,
	validatorDownloadPasteJson,
	validatorPaginationQuery,
	validatorParamStringSlug,
	verifyPasteSchema
} from '../utils/index.js'
import { enforceRestRateLimit } from '../utils/rate-limiter.js'
import { REST_RATE_LIMITS } from '../utils/request-limits.js'

interface PasteDownloadOptions {
	slug: string
	reader: Env['Variables']['user']
	password?: string | null
	beforePasswordVerify?: () => void
}

interface PasteDownloadResult {
	content: string
	contentDisposition: string
}

type PasteTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

type PasteAccessSnapshot = Pick<
	typeof pastesTable.$inferSelect,
	| 'id'
	| 'expiration'
	| 'expiresAt'
	| 'encrypted'
	| 'passwordHash'
	| 'visibility'
	| 'userId'
> & { expiresAtVersion: string | null; rowVersion: string }

function unchangedActivePasteCondition(paste: PasteAccessSnapshot) {
	return and(
		eq(pastesTable.id, paste.id),
		eq(pastesTable.expiration, paste.expiration),
		sql`${pastesTable.expiresAt}::text IS NOT DISTINCT FROM ${paste.expiresAtVersion}`,
		sql`${pastesTable.encrypted} IS NOT DISTINCT FROM ${paste.encrypted}`,
		sql`${pastesTable.passwordHash} IS NOT DISTINCT FROM ${paste.passwordHash}`,
		eq(pastesTable.visibility, paste.visibility),
		sql`${pastesTable.userId} IS NOT DISTINCT FROM ${paste.userId}`,
		activePasteCondition()
	)
}

async function incrementPasteHits(paste: PasteAccessSnapshot) {
	const [updatedPaste] = await db
		.update(pastesTable)
		.set({ hits: sql`${pastesTable.hits} + 1` })
		.where(unchangedActivePasteCondition(paste))
		.returning({ hits: pastesTable.hits })

	if (!updatedPaste) throwPasteNotFound()
	return updatedPaste.hits
}

async function consumeBurnAfterRead(paste: PasteAccessSnapshot) {
	return db.transaction(async (tx) => {
		await DoggoUtils.acquirePasteMutationLock(tx)

		const [deletedPaste] = await tx
			.delete(pastesTable)
			.where(
				and(
					unchangedActivePasteCondition(paste),
					sql`"pastes"."xmin"::text = ${paste.rowVersion}`,
					eq(pastesTable.expiration, 'burn_after_read')
				)
			)
			.returning({ hits: pastesTable.hits })

		if (!deletedPaste) throwPasteNotFound()
		await DoggoUtils.removeUnusedTags(tx)
		return deletedPaste
	})
}

async function resolveTagIds(
	tx: PasteTransaction,
	tagNames: string[]
): Promise<string[]> {
	if (tagNames.length === 0) return []

	await tx
		.insert(tagsTable)
		.values(tagNames.map((name) => ({ name })))
		.onConflictDoNothing({ target: tagsTable.name })

	const resolvedTags = await tx
		.select({ id: tagsTable.id, name: tagsTable.name })
		.from(tagsTable)
		.where(inArray(tagsTable.name, tagNames))
	const idByName = new Map(resolvedTags.map((tag) => [tag.name, tag.id]))

	return tagNames.map((name) => {
		const id = idByName.get(name)
		if (!id) throw new Error('Failed to resolve paste tag')
		return id
	})
}

export async function updateOwnedPasteById(
	id: string,
	userId: string,
	values: Partial<typeof pastesTable.$inferInsert>
) {
	const [updatedPaste] = await db
		.update(pastesTable)
		.set({ ...values, updatedAt: values.updatedAt ?? new Date() })
		.where(and(eq(pastesTable.id, id), eq(pastesTable.userId, userId)))
		.returning()

	return updatedPaste
}

async function handlePasteDownload({
	slug,
	reader,
	password = null,
	beforePasswordVerify
}: PasteDownloadOptions): Promise<PasteDownloadResult> {
	const [row] = await db
		.select({
			paste: {
				id: pastesTable.id,
				expiresAtVersion: sql<
					string | null
				>`"pastes"."expires_at"::text`,
				rowVersion: sql<string>`"pastes"."xmin"::text`,
				title: pastesTable.title,
				content: pastesTable.content,
				expiration: pastesTable.expiration,
				expiresAt: pastesTable.expiresAt,
				encrypted: pastesTable.encrypted,
				passwordHash: pastesTable.passwordHash,
				visibility: pastesTable.visibility,
				userId: pastesTable.userId
			},
			syntax: {
				extension: syntaxesTable.extension
			}
		})
		.from(pastesTable)
		.leftJoin(syntaxesTable, eq(pastesTable.syntaxId, syntaxesTable.id))
		.where(eq(pastesTable.slug, slug))

	if (!row) throwPasteNotFound()

	const { paste, syntax } = row
	await authorizePasteRead(paste, {
		mode: 'details',
		reader
	})
	if (paste.passwordHash && password !== null) beforePasswordVerify?.()
	await authorizePasteRead(paste, {
		mode: 'download',
		reader,
		password
	})

	if (paste.expiration === 'burn_after_read') {
		await consumeBurnAfterRead(paste)
	} else {
		await incrementPasteHits(paste)
	}

	const safeTitle = DoggoUtils.sanitizeFileName(paste.title)
	const extension = syntax?.extension || 'txt'

	return {
		content: paste.content,
		contentDisposition: `attachment; filename="${safeTitle}.${extension}"`
	}
}

function sendPasteDownload(c: Context<Env>, download: PasteDownloadResult) {
	c.header('Content-Type', 'text/plain; charset=utf-8')
	c.header('Content-Disposition', download.contentDisposition)

	return c.body(download.content)
}

async function assertPasswordHashReferences(
	folder: string,
	userId: string | null,
	syntax: string
): Promise<void> {
	if (folder !== 'none') {
		const [dbFolder] = await db
			.select({ id: foldersTable.id })
			.from(foldersTable)
			.where(
				and(
					eq(foldersTable.id, folder),
					eq(foldersTable.userId, userId as string)
				)
			)

		if (!dbFolder) {
			throw new GenericException({
				statusCode: 404,
				name: 'Not Found',
				message: 'Folder not found or does not belong to the user'
			})
		}
	}

	const [dbSyntax] = await db
		.select({ id: syntaxesTable.id })
		.from(syntaxesTable)
		.where(eq(syntaxesTable.name, syntax))

	if (!dbSyntax) {
		throw new GenericException({
			statusCode: 400,
			name: 'Bad Request',
			message: `Unknown syntax "${syntax}"`
		})
	}
}

const app = new Hono<Env>()
	.use('/:slug/download', async (c, next) => {
		c.header('Cache-Control', 'no-store')
		await next()
	})
	.post('/', validatorCreatePasteJson, async (c) => {
		// 1. Validated JSON data
		const {
			title,
			slug,
			description,
			content,
			category,
			tags,
			syntax,
			expiration,
			visibility,
			folder,
			password,
			passwordEnabled,
			pasteAsGuest,
			encrypted
		} = c.req.valid('json')

		if (slug === 'create') {
			throw new GenericException({
				statusCode: 409,
				name: 'Conflict',
				message: 'Slug cannot be "create"'
			})
		}

		// 2. User ID
		const user = c.get('user')

		if (visibility === 'private' && !user) {
			throw new GenericException({
				statusCode: 401,
				name: 'Unauthorized',
				message: 'Authentication is required to create a private paste'
			})
		}

		if (visibility === 'private' && pasteAsGuest) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'A private paste must have an owner'
			})
		}

		const userId = pasteAsGuest ? null : (user?.id ?? null)

		if (folder !== 'none' && userId === null) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Guests cannot assign a folder'
			})
		}

		// Password logic: hash ONLY if password is enabled but paste isn't encrypted
		let passwordHash: string | null = null

		if (passwordEnabled) {
			if (encrypted) {
				// CSE: no password, client encrypts
				passwordHash = null
			} else {
				// standard: we hash password
				if (!password) {
					throw new GenericException({
						statusCode: 400,
						name: 'Bad Request',
						message:
							'Password is required when encryption is disabled'
					})
				}
				await assertPasswordHashReferences(folder, userId, syntax)
				enforceRestRateLimit(c, REST_RATE_LIMITS.passwordHash)
				passwordHash = await argon2.hash(password)
			}
		}

		const uniqueTags = [...new Set(tags)]
		const generatedSlug = slug.length
			? slug
			: await DoggoUtils.generateSlug()
		const expiresAt = await DoggoUtils.calculateExpirationDate(expiration)

		const { newPaste, dbSyntax } = await db.transaction(async (tx) => {
			if (uniqueTags.length > 0) {
				await DoggoUtils.acquirePasteMutationLock(tx)
			}

			let folderId: string | null = null

			if (folder !== 'none') {
				const [dbFolder] = await tx
					.select({ id: foldersTable.id })
					.from(foldersTable)
					.where(
						and(
							eq(foldersTable.id, folder),
							eq(foldersTable.userId, userId as string)
						)
					)

				if (!dbFolder) {
					throw new GenericException({
						statusCode: 404,
						name: 'Not Found',
						message:
							'Folder not found or does not belong to the user'
					})
				}
				folderId = dbFolder.id
			}

			const [dbSyntax] = await tx
				.select({
					id: syntaxesTable.id,
					name: syntaxesTable.name,
					extension: syntaxesTable.extension,
					color: syntaxesTable.color
				})
				.from(syntaxesTable)
				.where(eq(syntaxesTable.name, syntax))

			if (!dbSyntax) {
				throw new GenericException({
					statusCode: 400,
					name: 'Bad Request',
					message: `Unknown syntax "${syntax}"`
				})
			}

			const [newPaste] = await tx
				.insert(pastesTable)
				.values({
					title,
					description,
					content,
					category,
					syntaxId: dbSyntax.id,
					expiration,
					visibility,
					folderId,
					userId,
					encrypted: encrypted ?? false,
					slug: generatedSlug,
					expiresAt,
					passwordHash
				})
				.returning()

			if (!newPaste) throw new Error('Failed to create paste')

			if (uniqueTags.length > 0) {
				const tagIds = await resolveTagIds(tx, uniqueTags)
				await tx.insert(pasteTagsTable).values(
					tagIds.map((tagId) => ({
						pasteId: newPaste.id,
						tagId
					}))
				)
			}

			return { newPaste, dbSyntax }
		})

		// 8. Return response
		c.status(201)
		return c.json({
			success: true,
			data: toPasteDetailsDto(
				pasteRecordToDetailsSource(newPaste),
				dbSyntax,
				uniqueTags,
				newPaste.passwordHash === null
			)
		})
	})
	.get('/', validatorPaginationQuery, async (c) => {
		const { limit, offset } = c.req.valid('query')
		const whereClause = and(
			eq(pastesTable.visibility, 'public'),
			activePasteCondition()
		)

		const [total] = await db
			.select({ count: sql<string>`COUNT(*)` })
			.from(pastesTable)
			.where(whereClause)
		const totalCount = Number(total?.count ?? 0)

		const pastes = await db
			.select({
				paste: pasteSummarySelection,
				syntax: {
					name: syntaxesTable.name,
					extension: syntaxesTable.extension,
					color: syntaxesTable.color
				}
			})
			.from(pastesTable)
			.leftJoin(syntaxesTable, eq(pastesTable.syntaxId, syntaxesTable.id))
			.where(whereClause)
			.orderBy(desc(pastesTable.updatedAt), desc(pastesTable.id))
			.limit(limit)
			.offset(offset)

		if (pastes.length === 0) {
			return c.json({ success: true, data: [], total: totalCount })
		}

		const pasteIds = pastes.map((p) => p.paste.id)
		const tags = await db
			.select({
				pasteId: pasteTagsTable.pasteId,
				name: tagsTable.name
			})
			.from(pasteTagsTable)
			.innerJoin(tagsTable, eq(pasteTagsTable.tagId, tagsTable.id))
			.where(inArray(pasteTagsTable.pasteId, pasteIds))

		const groupedTags: Record<string, string[]> = {}
		for (const { pasteId, name } of tags) {
			groupedTags[pasteId] ||= []
			groupedTags[pasteId].push(name)
		}

		const enrichedPastes: PasteSummaryDto[] = pastes.map(
			({ paste, syntax }) =>
				toPasteSummaryDto(paste, syntax, groupedTags[paste.id] || [])
		)

		return c.json({
			success: true,
			total: totalCount,
			data: enrichedPastes
		})
	})
	.get('/:slug', validatorParamStringSlug, async (c) => {
		const { slug } = c.req.valid('param')

		const [row] = await db
			.select({
				paste: {
					...pasteDetailsSelection,
					expiresAtVersion: sql<
						string | null
					>`"pastes"."expires_at"::text`,
					rowVersion: sql<string>`"pastes"."xmin"::text`
				},
				passwordHash: pastesTable.passwordHash,
				syntax: {
					name: syntaxesTable.name,
					extension: syntaxesTable.extension,
					color: syntaxesTable.color
				}
			})
			.from(pastesTable)
			.leftJoin(syntaxesTable, eq(pastesTable.syntaxId, syntaxesTable.id))
			.where(eq(pastesTable.slug, slug))

		if (!row) throwPasteNotFound()

		const paste = row.paste
		const syntax = row.syntax
		const accessSnapshot = {
			...paste,
			passwordHash: row.passwordHash
		}
		const readDecision = await authorizePasteRead(accessSnapshot, {
			mode: 'details',
			reader: c.get('user')
		})

		const tags = await db
			.select({ name: tagsTable.name })
			.from(pasteTagsTable)
			.innerJoin(tagsTable, eq(pasteTagsTable.tagId, tagsTable.id))
			.where(eq(pasteTagsTable.pasteId, paste.id))

		let hits = paste.hits
		if (readDecision.canReadContent) {
			if (
				paste.expiration === 'burn_after_read' &&
				!readDecision.passwordProtected &&
				!readDecision.clientEncrypted
			) {
				const deletedPaste = await consumeBurnAfterRead(accessSnapshot)
				hits = deletedPaste.hits + 1
			} else {
				hits = await incrementPasteHits(accessSnapshot)
			}
		}

		return c.json({
			success: true,
			data: toPasteDetailsDto(
				{ ...paste, hits },
				syntax,
				tags.map((tag) => tag.name),
				readDecision.canReadContent
			)
		})
	})
	.post('/:slug/verify', validatorParamStringSlug, async (c) => {
		const { slug } = c.req.valid('param')

		const [paste] = await db
			.select({
				id: pastesTable.id,
				expiresAtVersion: sql<
					string | null
				>`"pastes"."expires_at"::text`,
				rowVersion: sql<string>`"pastes"."xmin"::text`,
				content: pastesTable.content,
				passwordHash: pastesTable.passwordHash,
				expiration: pastesTable.expiration,
				expiresAt: pastesTable.expiresAt,
				encrypted: pastesTable.encrypted,
				visibility: pastesTable.visibility,
				userId: pastesTable.userId
			})
			.from(pastesTable)
			.where(eq(pastesTable.slug, slug))

		if (!paste) throwPasteNotFound()
		await authorizePasteRead(paste, {
			mode: 'details',
			reader: c.get('user')
		})

		const body = await c.req.json<unknown>().catch(() => null)
		const parsedBody = verifyPasteSchema.safeParse(body)
		if (parsedBody.success === false) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid verification data',
				details: parsedBody.error.issues.map((issue) => ({
					[issue.path.join('.')]: issue.message
				}))
			})
		}
		if (paste.passwordHash) {
			enforceRestRateLimit(c, REST_RATE_LIMITS.passwordVerify)
		}

		await authorizePasteRead(paste, {
			mode: 'verify',
			reader: c.get('user'),
			password: parsedBody.data.password
		})

		if (paste.expiration === 'burn_after_read') {
			await consumeBurnAfterRead(paste)
		} else {
			await incrementPasteHits(paste)
		}

		return c.json({
			success: true,
			content: paste.content
		})
	})
	.put(
		'/:slug',
		userGuard,
		validatorParamStringSlug,
		validatorCreatePasteJson,
		async (c) => {
			const { slug } = c.req.valid('param')
			const user = c.get('user')
			const {
				title,
				slug: newSlug,
				description,
				content,
				category,
				tags,
				syntax,
				expiration,
				visibility,
				folder,
				password,
				passwordEnabled,
				encrypted
			} = c.req.valid('json')

			const [selectedPaste] = await db
				.select({ id: pastesTable.id, userId: pastesTable.userId })
				.from(pastesTable)
				.where(eq(pastesTable.slug, slug))

			if (!selectedPaste) throwPasteNotFound()
			if (selectedPaste.userId !== user.id) {
				throw new GenericException({
					statusCode: 403,
					name: 'Forbidden',
					message: 'You are not the owner of this paste'
				})
			}

			let passwordHash: string | null = null

			if (passwordEnabled) {
				if (encrypted) {
					passwordHash = null
				} else {
					await assertPasswordHashReferences(folder, user.id, syntax)
					enforceRestRateLimit(c, REST_RATE_LIMITS.passwordHash)
					passwordHash = await argon2.hash(password)
				}
			}

			const uniqueTags = [...new Set(tags)]
			const generatedSlug = newSlug.length
				? newSlug
				: await DoggoUtils.generateSlug()
			const expiresAt =
				await DoggoUtils.calculateExpirationDate(expiration)

			const { updatedPaste, dbSyntax } = await db.transaction(
				async (tx) => {
					await DoggoUtils.acquirePasteMutationLock(tx)

					const [paste] = await tx
						.select()
						.from(pastesTable)
						.where(eq(pastesTable.id, selectedPaste.id))
						.for('update')

					if (!paste) throwPasteNotFound()

					if (paste.userId !== user.id) {
						throw new GenericException({
							statusCode: 403,
							name: 'Forbidden',
							message: 'You are not the owner of this paste'
						})
					}

					let folderId: string | null = null
					if (folder !== 'none') {
						const [dbFolder] = await tx
							.select({ id: foldersTable.id })
							.from(foldersTable)
							.where(
								and(
									eq(foldersTable.id, folder),
									eq(foldersTable.userId, user.id)
								)
							)

						if (!dbFolder) {
							throw new GenericException({
								statusCode: 404,
								name: 'Not Found',
								message:
									'Folder not found or does not belong to the user'
							})
						}
						folderId = dbFolder.id
					}

					const [dbSyntax] = await tx
						.select({
							id: syntaxesTable.id,
							name: syntaxesTable.name,
							extension: syntaxesTable.extension,
							color: syntaxesTable.color
						})
						.from(syntaxesTable)
						.where(eq(syntaxesTable.name, syntax))

					if (!dbSyntax) {
						throw new GenericException({
							statusCode: 400,
							name: 'Bad Request',
							message: `Unknown syntax "${syntax}"`
						})
					}

					const [updatedPaste] = await tx
						.update(pastesTable)
						.set({
							title,
							slug: generatedSlug,
							description,
							content,
							category,
							syntaxId: dbSyntax.id,
							expiration,
							expiresAt,
							visibility,
							folderId,
							updatedAt: new Date(),
							encrypted: encrypted ?? false,
							passwordHash
						})
						.where(
							and(
								eq(pastesTable.id, paste.id),
								eq(pastesTable.userId, user.id)
							)
						)
						.returning()

					if (!updatedPaste) throwPasteNotFound()

					await tx
						.delete(pasteTagsTable)
						.where(eq(pasteTagsTable.pasteId, paste.id))

					const tagIds = await resolveTagIds(tx, uniqueTags)
					if (tagIds.length > 0) {
						await tx.insert(pasteTagsTable).values(
							tagIds.map((tagId) => ({
								pasteId: paste.id,
								tagId
							}))
						)
					}

					await DoggoUtils.removeUnusedTags(tx)
					return { updatedPaste, dbSyntax }
				}
			)

			// 10. Return response
			c.status(200)
			return c.json({
				success: true,
				data: toPasteDetailsDto(
					pasteRecordToDetailsSource(updatedPaste),
					dbSyntax,
					uniqueTags,
					updatedPaste.passwordHash === null
				)
			})
		}
	)
	.delete('/:slug', userGuard, validatorParamStringSlug, async (c) => {
		const { slug } = c.req.valid('param')
		const user = c.get('user')

		await db.transaction(async (tx) => {
			await DoggoUtils.acquirePasteMutationLock(tx)

			const [paste] = await tx
				.select()
				.from(pastesTable)
				.where(eq(pastesTable.slug, slug))
				.for('update')

			if (!paste) throwPasteNotFound()

			if (paste.userId !== user.id) {
				throw new GenericException({
					statusCode: 403,
					name: 'Forbidden',
					message: 'You are not the owner of this paste'
				})
			}

			await tx
				.delete(pastesTable)
				.where(
					and(
						eq(pastesTable.id, paste.id),
						eq(pastesTable.userId, user.id)
					)
				)
			await DoggoUtils.removeUnusedTags(tx)
		})

		c.status(200)
		return c.json({
			success: true,
			message: 'Paste deleted successfully'
		})
	})
	.get('/:slug/download', validatorParamStringSlug, async (c) => {
		const { slug } = c.req.valid('param')

		if (c.req.query('password') !== undefined) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Passwords are not accepted in query parameters'
			})
		}

		const download = await handlePasteDownload({
			slug,
			reader: c.get('user')
		})
		return sendPasteDownload(c, download)
	})
	.post(
		'/:slug/download',
		validatorParamStringSlug,
		validatorDownloadPasteJson,
		async (c) => {
			const { slug } = c.req.valid('param')
			const { password } = c.req.valid('json')

			const download = await handlePasteDownload({
				slug,
				reader: c.get('user'),
				password,
				beforePasswordVerify: () =>
					enforceRestRateLimit(c, REST_RATE_LIMITS.passwordVerify)
			})
			return sendPasteDownload(c, download)
		}
	)

export type AppType = typeof app
export default app
