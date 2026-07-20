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
	validatorParamStringSlug
} from '../utils/index.js'

interface PasteDownloadOptions {
	slug: string
	reader: Env['Variables']['user']
	password?: string | null
}

interface PasteDownloadResult {
	content: string
	contentDisposition: string
}

export async function updateOwnedPasteById(
	id: string,
	userId: string,
	values: Partial<typeof pastesTable.$inferInsert>
) {
	const [updatedPaste] = await db
		.update(pastesTable)
		.set(values)
		.where(and(eq(pastesTable.id, id), eq(pastesTable.userId, userId)))
		.returning()

	return updatedPaste
}

async function handlePasteDownload({
	slug,
	reader,
	password = null
}: PasteDownloadOptions): Promise<PasteDownloadResult> {
	const [row] = await db
		.select({
			paste: {
				id: pastesTable.id,
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
		mode: 'download',
		reader,
		password
	})

	await db
		.update(pastesTable)
		.set({ hits: sql`${pastesTable.hits} + 1` })
		.where(eq(pastesTable.id, paste.id))

	if (paste.expiration === 'burn_after_read') {
		await db.delete(pastesTable).where(eq(pastesTable.id, paste.id))
		await DoggoUtils.removeUnusedTags()
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

		// 3. Resolve folder (must already exist and belong to the user)
		let folderId: string | null = null

		if (folder !== 'none') {
			if (userId === null) {
				throw new GenericException({
					statusCode: 400,
					name: 'Bad Request',
					message: 'Guests cannot assign a folder'
				})
			}

			const [dbFolder] = await db
				.select({ id: foldersTable.id })
				.from(foldersTable)
				.where(
					and(
						eq(foldersTable.id, folder),
						eq(foldersTable.userId, userId)
					)
				)

			if (!dbFolder) {
				throw new GenericException({
					statusCode: 404,
					name: 'Not Found',
					message: 'Folder not found or does not belong to the user'
				})
			}

			folderId = dbFolder.id
		}

		// 4. Find syntax by name
		const [dbSyntax] = await db
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

		// 5. Create or reuse tags
		const tagIds: string[] = []
		for (const tagName of tags) {
			// try to find the tag by name
			let [dbTag] = await db
				.select({ id: tagsTable.id })
				.from(tagsTable)
				.where(eq(tagsTable.name, tagName))

			// if tag does not exist, create it
			if (!dbTag) {
				;[dbTag] = await db
					.insert(tagsTable)
					.values({ name: tagName })
					.returning({ id: tagsTable.id })
			}

			if (dbTag) tagIds.push(dbTag.id)
		}

		// 6. Create paste
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
				passwordHash = await argon2.hash(password)
			}
		}

		const newPasteValues = {
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
			slug: slug.length ? slug : await DoggoUtils.generateSlug(),
			expiresAt: await DoggoUtils.calculateExpirationDate(expiration),
			passwordHash: passwordHash
		}

		const [newPaste] = await db
			.insert(pastesTable)
			.values(newPasteValues)
			.returning()

		// 7. Add tags to paste
		if (tagIds.length > 0 && newPaste) {
			await db.insert(pasteTagsTable).values(
				tagIds.map((tagId) => ({
					pasteId: newPaste.id,
					tagId
				}))
			)
		}

		// 8. Return response
		c.status(201)
		return c.json({
			success: true,
			data: toPasteDetailsDto(
				pasteRecordToDetailsSource(newPaste),
				dbSyntax,
				tags,
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
				paste: pasteDetailsSelection,
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
		const readDecision = await authorizePasteRead(
			{ ...paste, passwordHash: row.passwordHash },
			{ mode: 'details', reader: c.get('user') }
		)

		const tags = await db
			.select({ name: tagsTable.name })
			.from(pasteTagsTable)
			.innerJoin(tagsTable, eq(pasteTagsTable.tagId, tagsTable.id))
			.where(eq(pasteTagsTable.pasteId, paste.id))

		let hits = paste.hits
		if (readDecision.canReadContent) {
			const [updatedPaste] = await db
				.update(pastesTable)
				.set({ hits: sql`${pastesTable.hits} + 1` })
				.where(eq(pastesTable.id, paste.id))
				.returning({ hits: pastesTable.hits })
			hits = updatedPaste?.hits ?? paste.hits
		}

		if (
			paste.expiration === 'burn_after_read' &&
			!readDecision.passwordProtected &&
			!readDecision.clientEncrypted
		) {
			await db.delete(pastesTable).where(eq(pastesTable.id, paste.id))
			await DoggoUtils.removeUnusedTags()
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

		const body = await c.req
			.json<{ password?: unknown }>()
			.catch(() => null)
		const password =
			typeof body?.password === 'string' ? body.password : null

		await authorizePasteRead(paste, {
			mode: 'verify',
			reader: c.get('user'),
			password
		})

		await db
			.update(pastesTable)
			.set({ hits: sql`${pastesTable.hits} + 1` })
			.where(eq(pastesTable.id, paste.id))

		if (paste.expiration === 'burn_after_read') {
			await db.delete(pastesTable).where(eq(pastesTable.id, paste.id))
			await DoggoUtils.removeUnusedTags()
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

			// 1. Get paste by slug
			const [paste] = await db
				.select()
				.from(pastesTable)
				.where(eq(pastesTable.slug, slug))

			if (!paste) {
				throw new GenericException({
					statusCode: 404,
					name: 'Not Found',
					message: 'Paste not found'
				})
			}

			// 2. Check if the user is the owner
			if (paste.userId !== user.id) {
				throw new GenericException({
					statusCode: 403,
					name: 'Forbidden',
					message: 'You are not the owner of this paste'
				})
			}

			// 3. Resolve folder
			let folderId: string | null = paste.folderId

			if (folder === 'none') {
				folderId = null
			} else {
				const [dbFolder] = await db
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

			// 4. Resolve syntax
			const [dbSyntax] = await db
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

			// 5. Password and encryption
			let passwordHash: string | null = null

			if (passwordEnabled) {
				if (encrypted) {
					passwordHash = null
				} else {
					passwordHash = await argon2.hash(password)
				}
			}

			// 6. Update paste
			const values = {
				title,
				slug: newSlug.length
					? newSlug
					: await DoggoUtils.generateSlug(),
				description,
				content,
				category,
				syntaxId: dbSyntax.id,
				expiration,
				expiresAt: await DoggoUtils.calculateExpirationDate(expiration),
				visibility,
				folderId,
				updatedAt: new Date(),
				encrypted: encrypted ?? false,
				passwordHash: passwordHash
			}

			const updatedPaste = await updateOwnedPasteById(
				paste.id,
				user.id,
				values
			)

			if (!updatedPaste) throwPasteNotFound()

			// 7. Remove old tags
			await db
				.delete(pasteTagsTable)
				.where(eq(pasteTagsTable.pasteId, paste.id))

			// 8. Add new tags
			const tagIds: string[] = []
			for (const tagName of tags) {
				const [existingTag] = await db
					.select({ id: tagsTable.id })
					.from(tagsTable)
					.where(eq(tagsTable.name, tagName))

				let tagId = existingTag?.id

				if (!tagId) {
					const [newTag] = await db
						.insert(tagsTable)
						.values({ name: tagName })
						.returning({ id: tagsTable.id })
					tagId = newTag.id
				}

				if (tagId) tagIds.push(tagId)
			}

			if (tagIds.length > 0) {
				await db.insert(pasteTagsTable).values(
					tagIds.map((tagId) => ({
						pasteId: paste.id,
						tagId
					}))
				)
			}

			// 9. Cleanup tags
			await DoggoUtils.removeUnusedTags()

			// 10. Return response
			c.status(200)
			return c.json({
				success: true,
				data: toPasteDetailsDto(
					pasteRecordToDetailsSource(updatedPaste),
					dbSyntax,
					tags,
					updatedPaste.passwordHash === null
				)
			})
		}
	)
	.delete('/:slug', userGuard, validatorParamStringSlug, async (c) => {
		const { slug } = c.req.valid('param')
		const user = c.get('user')

		// 1. Find the paste by slug
		const [paste] = await db
			.select()
			.from(pastesTable)
			.where(eq(pastesTable.slug, slug))

		if (!paste) {
			throw new GenericException({
				statusCode: 404,
				name: 'Not Found',
				message: 'Paste not found'
			})
		}

		// 2. Check if the user is the owner
		if (paste.userId !== user.id) {
			throw new GenericException({
				statusCode: 403,
				name: 'Forbidden',
				message: 'You are not the owner of this paste'
			})
		}

		// 3. Delete the paste (cascade deletes tags via FK)
		await db.delete(pastesTable).where(eq(pastesTable.id, paste.id))
		await DoggoUtils.removeUnusedTags()

		// 4. Return success
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
				password
			})
			return sendPasteDownload(c, download)
		}
	)

export type AppType = typeof app
export default app
