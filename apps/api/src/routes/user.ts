import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/index.js'
import {
	pastesTable,
	pasteTagsTable,
	syntaxesTable,
	tagsTable,
	usersTable
} from '../db/schema.js'
import type { Env } from '../types.js'

const app = new Hono<Env>()
	.get('/pastes', async (c) => {
		const user = c.get('user')

		const limit = Math.max(
			0,
			Number.parseInt(c.req.query('limit') || '10', 10)
		)
		const offset = Math.max(
			0,
			Number.parseInt(c.req.query('offset') || '0', 10)
		)

		const ownerId = c.req.query('userId') ?? user?.id
		if (!ownerId) {
			return c.json(
				{
					success: false,
					message:
						'Missing userId. Provide ?userId=<ownerId> or authenticate to view your own pastes.'
				},
				400
			)
		}

		const isOwner = user?.id === ownerId

		const whereClause = isOwner
			? eq(pastesTable.userId, ownerId)
			: and(
					eq(pastesTable.userId, ownerId),
					eq(pastesTable.visibility, 'public')
				)

		const [total] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(pastesTable)
			.where(whereClause)

		const pastes = await db
			.select({
				paste: pastesTable,
				syntax: {
					name: syntaxesTable.name,
					extension: syntaxesTable.extension,
					color: syntaxesTable.color
				}
			})
			.from(pastesTable)
			.leftJoin(syntaxesTable, eq(pastesTable.syntaxId, syntaxesTable.id))
			.where(whereClause)
			.orderBy(desc(pastesTable.updatedAt))
			.limit(limit)
			.offset(offset)

		if (pastes.length === 0) {
			return c.json({ success: true, data: [], total: 0 })
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

		const enrichedPastes = pastes.map(({ paste, syntax }) => ({
			...paste,
			tags: groupedTags[paste.id] || [],
			syntax
		}))

		return c.json({
			success: true,
			total: total.count,
			data: enrichedPastes
		})
	})
	.get('/name/:name', async (c) => {
		const { name } = c.req.param()

		if (!name || name.trim().length === 0) {
			return c.json(
				{ success: false, message: 'Missing or empty :name param' },
				400
			)
		}

		const [userRow] = await db
			.select({
				id: usersTable.id,
				name: usersTable.name,
				createdAt: usersTable.createdAt,
				role: usersTable.role
			})
			.from(usersTable)
			.where(eq(usersTable.name, name))
			.limit(1)

		if (!userRow) {
			return c.json({ success: false, message: 'User not found' }, 404)
		}

		return c.json({ success: true, data: userRow })
	})

export type AppType = typeof app
export default app
