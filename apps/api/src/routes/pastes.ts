import * as argon2 from 'argon2'
import { eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/index.js'
import {
	foldersTable,
	pasteTagsTable,
	pastesTable,
	tagsTable
} from '../db/schema.js'
import { GenericException } from '../exceptions/generic-exception.js'
import { userGuard } from '../middlewares/user-guard.js'
import type { Env } from '../types.js'
import {
	validatorCreatePasteJson,
	validatorParamStringSlug
} from '../utils/index.js'
import { DoggoUtils } from '../utils/index.js'

const app = new Hono<Env>()
	.post('/', validatorCreatePasteJson, async (c) => {
		// 1. Validated JSON data
		const {
			title,
			slug,
			content,
			category,
			tags,
			syntax,
			expiration,
			visibility,
			folder,
			password,
			passwordEnabled,
			pasteAsGuest
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
		let userId = null
		if (user) {
			userId = user.id
		}
		if (pasteAsGuest) {
			userId = null
		}

		// 3. Create folder if it does not exist
		let folderId = null
		if (folder !== 'none' && userId !== null) {
			const [dbFolder] = await db
				.insert(foldersTable)
				.values({
					name: folder,
					userId
				})
				.onConflictDoNothing()
				.returning({ id: foldersTable.id })

			folderId = dbFolder.id
		}

		// 4. Create or reuse tags
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

			if (dbTag) {
				tagIds.push(dbTag.id)
			}
		}

		// 5. Create paste
		const newPasteValues = {
			title,
			content,
			category,
			syntax,
			expiration,
			visibility,
			folderId,
			userId,
			slug: slug.length ? slug : await DoggoUtils.generateSlug(),
			expiresAt: await DoggoUtils.calculateExpirationDate(expiration),
			passwordHash: passwordEnabled ? await argon2.hash(password) : null
		}
		const [newPaste] = await db
			.insert(pastesTable)
			.values(newPasteValues)
			.returning()

		// 6. Add tags to paste
		if (tagIds.length > 0 && newPaste) {
			await db.insert(pasteTagsTable).values(
				tagIds.map((tagId) => ({
					pasteId: newPaste.id,
					tagId
				}))
			)
		}

		// 7. Return response
		c.status(201)
		return c.json({
			success: true,
			data: newPaste
		})
	})
	.get('/', async (c) => {
		const limit = Number.parseInt(c.req.query('limit') || '10')
		const offset = Number.parseInt(c.req.query('offset') || '0')

		const [total] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(pastesTable)
			.where(eq(pastesTable.visibility, 'public'))

		const pastes = await db
			.select()
			.from(pastesTable)
			.where(eq(pastesTable.visibility, 'public'))
			.limit(limit)
			.offset(offset)

		if (pastes.length === 0) {
			return c.json({ success: true, data: [], total: 0 })
		}

		const pasteIds = pastes.map((p) => p.id)

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

		const enriched = pastes.map((p) => ({
			...p,
			tags: groupedTags[p.id] || []
		}))

		return c.json({
			success: true,
			data: enriched,
			total: total.count
		})
	})
	.get('/:slug', validatorParamStringSlug, async (c) => {
		const { slug } = c.req.valid('param')

		// 1. Get paste by slug
		const [paste] = await db
			.select()
			.from(pastesTable)
			.where(eq(pastesTable.slug, slug))

		if (!paste) {
			throw new GenericException({
				statusCode: 404,
				name: 'NotFound',
				message: 'Paste not found'
			})
		}

		// 2. Get tags for the paste
		const tags = await db
			.select({ name: tagsTable.name })
			.from(pasteTagsTable)
			.innerJoin(tagsTable, eq(pasteTagsTable.tagId, tagsTable.id))
			.where(eq(pasteTagsTable.pasteId, paste.id))

		// 3. Delete if burn_after_read BEFORE sending response
		if (paste.expiration === 'burn_after_read') {
			await db.delete(pastesTable).where(eq(pastesTable.id, paste.id))

			// Optional: clean up orphan tags
			await db.execute(`
		  DELETE FROM tags
		  WHERE id NOT IN (
			SELECT DISTINCT tag_id FROM paste_tags
		  )
		`)
		}

		// 4. Return response
		return c.json({
			success: true,
			data: {
				...paste,
				tags: tags.map((t) => t.name)
			}
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
				content,
				category,
				tags,
				syntax,
				expiration,
				visibility,
				folder,
				password,
				passwordEnabled
			} = c.req.valid('json')

			// 1. Get paste by slug
			const [paste] = await db
				.select()
				.from(pastesTable)
				.where(eq(pastesTable.slug, slug))

			if (!paste) {
				throw new GenericException({
					statusCode: 404,
					name: 'NotFound',
					message: 'Paste not found'
				})
			}

			// 2. Check if the user is the owner of the paste
			if (paste.userId !== user.id) {
				throw new GenericException({
					statusCode: 403,
					name: 'Forbidden',
					message: 'You are not the owner of this paste'
				})
			}

			// 3. Create folder if it does not exist
			let folderId = null
			if (folder !== 'none') {
				const [dbFolder] = await db
					.insert(foldersTable)
					.values({
						name: folder,
						userId: user.id
					})
					.onConflictDoNothing()
					.returning({ id: foldersTable.id })

				folderId = dbFolder?.id || paste.folderId
			}

			// 4. Update paste
			const values = {
				title,
				slug: newSlug.length
					? newSlug
					: await DoggoUtils.generateSlug(),
				content,
				category,
				syntax,
				expiration,
				expiresAt: await DoggoUtils.calculateExpirationDate(expiration),
				visibility,
				folderId,
				passwordHash: passwordEnabled
					? await argon2.hash(password)
					: null
			}
			const updatedPaste = await db
				.update(pastesTable)
				.set(values)
				.where(eq(pastesTable.slug, slug))
				.returning()

			// 5. Remove old tags
			await db
				.delete(pasteTagsTable)
				.where(eq(pasteTagsTable.pasteId, paste.id))

			// 6. Add new tags
			const tagIds: string[] = []

			for (const tagName of tags) {
				// 6.1. Check if tag exists
				const [existingTag] = await db
					.select({ id: tagsTable.id })
					.from(tagsTable)
					.where(eq(tagsTable.name, tagName))

				let tagId = existingTag?.id

				// if tag does not exist, create it
				if (!tagId) {
					const [newTag] = await db
						.insert(tagsTable)
						.values({ name: tagName })
						.returning({ id: tagsTable.id })

					tagId = newTag.id
				}

				if (tagId) {
					tagIds.push(tagId)
				}
			}

			// 7. Add tags to paste
			if (tagIds.length > 0) {
				await db.insert(pasteTagsTable).values(
					tagIds.map((tagId) => ({
						pasteId: paste.id,
						tagId
					}))
				)
			}

			// 7. Return response
			c.status(200)
			return c.json({
				success: true,
				data: updatedPaste[0]
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
				name: 'NotFound',
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

		// 4. Return success
		c.status(200)
		return c.json({
			success: true,
			message: 'Paste deleted successfully'
		})
	})

export default app
