import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/index.js'
import {
	foldersTable,
	pastesTable,
	pasteTagsTable,
	syntaxesTable,
	tagsTable,
	usersTable
} from '../db/schema.js'
import type { Env } from '../types.js'
import {
	activePasteCondition,
	type PasteSummaryDto,
	pasteSummarySelection,
	toPasteSummaryDto,
	validatorUserPastesQuery
} from '../utils/index.js'

const app = new Hono<Env>()
	.get('/pastes', validatorUserPastesQuery, async (c) => {
		const user = c.get('user')
		const { limit, offset, userId } = c.req.valid('query')

		const ownerId = userId ?? user?.id
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
			? and(eq(pastesTable.userId, ownerId), activePasteCondition())
			: and(
					eq(pastesTable.userId, ownerId),
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
				},
				folderName: foldersTable.name,
				userName: usersTable.name
			})
			.from(pastesTable)
			.leftJoin(syntaxesTable, eq(pastesTable.syntaxId, syntaxesTable.id))
			.leftJoin(foldersTable, eq(pastesTable.folderId, foldersTable.id))
			.leftJoin(usersTable, eq(pastesTable.userId, usersTable.id))
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
			({ paste, syntax, folderName, userName }) =>
				toPasteSummaryDto(paste, syntax, groupedTags[paste.id] || [], {
					folderName,
					userName
				})
		)

		return c.json({
			success: true,
			total: totalCount,
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
