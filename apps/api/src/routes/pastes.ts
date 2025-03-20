import * as argon2 from 'argon2'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/index.js'
import {
	foldersTable,
	pasteTagsTable,
	pastesTable,
	tagsTable
} from '../db/schema.js'
import { userGuard } from '../middlewares/user-guard.js'
import type { Env } from '../types.js'
import {
	validatorCreatePasteJson,
	validatorParamStringId
} from '../utils/index.js'
import { DoggoUtils } from '../utils/index.js'

const app = new Hono<Env>()
	.post('/', validatorCreatePasteJson, async (c) => {
		// 1. Validated JSON data
		const {
			title,
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

		// 4. Create tags if they do not exist
		const tagIds: string[] = []
		for (const tagName of tags) {
			const [dbTag] = await db
				.insert(tagsTable)
				.values({
					name: tagName
				})
				.onConflictDoNothing()
				.returning({ id: tagsTable.id })

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
			slug: await DoggoUtils.generateSlug(),
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
		const pastes = await db.select().from(pastesTable)

		c.status(200)
		return c.json({
			success: true,
			data: pastes
		})
	})
	.get('/:id', userGuard, validatorParamStringId, async (c) => {
		const { id } = c.req.valid('param')
		const paste = await db
			.select()
			.from(pastesTable)
			.where(eq(pastesTable.id, id))

		c.status(200)
		return c.json({
			success: true,
			data: paste[0]
		})
	})
	.put('/:id', validatorParamStringId, async (c) => {
		const paste = 'paste'
		return c.json(paste)
	})
	.delete('/:id', validatorParamStringId, async (c) => {
		const paste = 'paste'
		return c.json(paste)
	})

export default app
