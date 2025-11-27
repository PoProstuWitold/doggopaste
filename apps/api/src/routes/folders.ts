import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { Hono } from 'hono'
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
	validatorCreateFolderJson,
	validatorFolderIdParam,
	validatorListFoldersQuery,
	validatorUpdateFolderJson
} from '../utils/schemas.js'

/**
 * Folders API
 *
 * Endpoints:
 *  POST   /         -> create (or reuse) a folder (root or nested)
 *  GET    /         -> list user's folders; supports ?parentId=... to list children of a given parent
 *  GET    /all      -> list all user's folders (flat)
 *  GET    /:id	     -> get folder by id and corresponding pastes
 *  PATCH  /:id      -> rename and/or move (change parent)
 *  DELETE /:id      -> delete folder (children get parent=null; pastes get folder_id=null via FK)
 */
const app = new Hono<Env>()
	/**
	 * Create (or reuse) a folder.
	 * Body JSON:
	 * - name: string (required)
	 * - parentId?: string | null  (optional; null/root means top-level)
	 *
	 * Behavior:
	 * - Ensures the folder belongs to the authenticated user.
	 * - If a folder with the same (userId, parentId, name) exists, returns the existing one.
	 */
	.post('/', userGuard, validatorCreateFolderJson, async (c) => {
		const user = c.get('user')

		const { name, parentId } = c.req.valid('json')
		if (!name || typeof name !== 'string') {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Field "name" is required'
			})
		}

		// If parentId is provided, verify it belongs to the same user
		const normalizedParentId: string | null = parentId ?? null
		if (normalizedParentId) {
			const [parent] = await db
				.select({ id: foldersTable.id })
				.from(foldersTable)
				.where(
					and(
						eq(foldersTable.id, normalizedParentId),
						eq(foldersTable.userId, user.id)
					)
				)

			if (!parent) {
				throw new GenericException({
					statusCode: 404,
					name: 'Not Found',
					message:
						'Parent folder not found or does not belong to the user'
				})
			}
		}

		// Try to insert; if a sibling with the same name exists, reuse it
		// 1) First, check if a folder with the same name already exists for this user and parent
		const [existing] = await db
			.select()
			.from(foldersTable)
			.where(
				and(
					eq(foldersTable.userId, user.id),
					normalizedParentId === null
						? sql`${foldersTable.parentFolderId} IS NULL`
						: eq(foldersTable.parentFolderId, normalizedParentId),
					eq(foldersTable.name, name)
				)
			)

		if (existing) {
			// already exists - return the existing folder (re-use)
			return c.json({ success: true, data: existing })
		}

		// 2) Does not exist - insert a new one
		const inserted = await db
			.insert(foldersTable)
			.values({
				name,
				userId: user.id,
				parentFolderId: normalizedParentId
			})
			.onConflictDoNothing() // safety in a case of race
			.returning()

		if (inserted) {
			c.status(201)
			return c.json({ success: true, data: inserted })
		}

		// 3) Race condition (someone inserted between select and insert) - fetch and return the existing one
		const [raced] = await db
			.select()
			.from(foldersTable)
			.where(
				and(
					eq(foldersTable.userId, user.id),
					normalizedParentId === null
						? sql`${foldersTable.parentFolderId} IS NULL`
						: eq(foldersTable.parentFolderId, normalizedParentId),
					eq(foldersTable.name, name)
				)
			)

		if (!raced) {
			throw new GenericException({
				statusCode: 500,
				name: 'Internal Server Error',
				message: 'Could not create or fetch the folder'
			})
		}

		return c.json({ success: true, data: raced })
	})
	/**
	 * List folders for the authenticated user.
	 * Query:
	 * - parentId?: string | null
	 *
	 * If parentId is provided:
	 *   returns only the direct children of that parent.
	 * If omitted:
	 *   returns root-level folders (parent=null).
	 */
	.get('/', userGuard, validatorListFoldersQuery, async (c) => {
		const user = c.get('user')
		const { parentId } = c.req.valid('query')

		const where = and(
			eq(foldersTable.userId, user.id),
			parentId === null
				? sql`${foldersTable.parentFolderId} IS NULL`
				: parentId
					? eq(foldersTable.parentFolderId, parentId)
					: sql`${foldersTable.parentFolderId} IS NULL`
		)

		const rows = await db
			.select()
			.from(foldersTable)
			.where(where)
			.orderBy(foldersTable.name)
		return c.json({ success: true, data: rows })
	})
	/**
	 * List all folders (flat) for the authenticated user.
	 * Useful for building trees client-side.
	 */
	.get('/all', userGuard, async (c) => {
		const user = c.get('user')

		const f = foldersTable
		const sf = alias(foldersTable, 'sf') // subfolders alias
		const p = pastesTable

		const rows = await db
			.select({
				id: f.id,
				name: f.name,
				parentFolderId: f.parentFolderId,
				createdAt: f.createdAt,
				updatedAt: f.updatedAt,
				userId: f.userId,
				subfoldersCount: sql<number>`COALESCE(CAST(COUNT(DISTINCT ${sf.id}) AS int), 0)`,
				pastesCount: sql<number>`COALESCE(CAST(COUNT(DISTINCT ${p.id})  AS int), 0)`
			})
			.from(f)
			// biome-ignore lint: false positive
			// @ts-ignore
			.leftJoin(sf, eq(sf.parentFolderId, f.id))
			.leftJoin(p, eq(p.folderId, f.id))
			.where(eq(f.userId, user.id))
			.groupBy(f.id)
			.orderBy(f.parentFolderId, f.name)

		return c.json({ success: true, data: rows })
	})
	/**
	 * Update a folder's name and/or parent.
	 * Body JSON (all optional, but at least one must be provided):
	 * - name?: string
	 * - parentId?: string | null
	 *
	 * Rules:
	 * - Parent (if provided) must belong to the same user.
	 * - Cannot set parent equal to folder id.
	 * - (Cycle detection not included here; keep UI guarded or add server-side recursion check if needed.)
	 */
	.patch(
		'/:id',
		userGuard,
		validatorFolderIdParam,
		validatorUpdateFolderJson,
		async (c) => {
			const user = c.get('user')
			const { id } = c.req.valid('param')
			const body = c.req.valid('json')

			const [folder] = await db
				.select()
				.from(foldersTable)
				.where(
					and(
						eq(foldersTable.id, id),
						eq(foldersTable.userId, user.id)
					)
				)

			if (!folder) {
				throw new GenericException({
					statusCode: 404,
					name: 'Not Found',
					message: 'Folder not found'
				})
			}

			const updates: Partial<typeof foldersTable.$inferInsert> = {}

			if (typeof body.name === 'string' && body.name.trim().length > 0) {
				updates.name = body.name.trim()
			}

			if (Object.keys(updates).length === 0) {
				return c.json({ success: true, data: folder }) // nothing to change
			}

			// Enforce sibling uniqueness for name changes
			if (updates.name) {
				const [conflict] = await db
					.select({ id: foldersTable.id })
					.from(foldersTable)
					.where(
						and(
							eq(foldersTable.userId, user.id),
							folder.parentFolderId === null
								? sql`${foldersTable.parentFolderId} IS NULL`
								: eq(
										foldersTable.parentFolderId,
										folder.parentFolderId
									),
							eq(foldersTable.name, updates.name),
							sql`${foldersTable.id} <> ${id}`
						)
					)

				if (conflict) {
					throw new GenericException({
						statusCode: 409,
						name: 'Conflict',
						message:
							'A folder with that name already exists at this level'
					})
				}
			}

			const [updated] = await db
				.update(foldersTable)
				.set(updates)
				.where(
					and(
						eq(foldersTable.id, id),
						eq(foldersTable.userId, user.id)
					)
				)
				.returning()

			// Unique sibling name violation will bubble from DB
			return c.json({ success: true, data: updated })
		}
	)
	/**
	 * Delete a folder.
	 * Effects:
	 * - Child folders: parent set to NULL (via FK ON DELETE SET NULL).
	 * - Pastes in this folder: folder_id set to NULL (via FK ON DELETE SET NULL).
	 */
	.delete('/:id', userGuard, validatorFolderIdParam, async (c) => {
		const user = c.get('user')
		const { id } = c.req.valid('param')

		// Ensure the folder belongs to the user
		const [folder] = await db
			.select({ id: foldersTable.id })
			.from(foldersTable)
			.where(
				and(eq(foldersTable.id, id), eq(foldersTable.userId, user.id))
			)

		if (!folder) {
			throw new GenericException({
				statusCode: 404,
				name: 'Not Found',
				message: 'Folder not found'
			})
		}

		// Recursive CTE collects all descendant folders and deletes them in one statement.
		// This avoids multiple round-trips and fragile manual array assembly.
		const recursiveDelete = sql`WITH RECURSIVE folder_tree AS (
			SELECT id, parent_folder_id FROM folders WHERE id = ${id} AND user_id = ${user.id}
			UNION ALL
			SELECT f.id, f.parent_folder_id
			FROM folders f
			JOIN folder_tree ft ON f.parent_folder_id = ft.id
			WHERE f.user_id = ${user.id}
		)
		DELETE FROM folders WHERE id IN (SELECT id FROM folder_tree) RETURNING id;`

		const deleted = (await db.execute(recursiveDelete)) as unknown as {
			rows?: { id: string }[]
		}

		// biome-ignore lint: no need to narrow
		const count = Array.isArray((deleted as any)?.rows)
			? // biome-ignore lint: no need to narrow
				(deleted as any).rows.length
			: undefined
		return c.json({ success: true, deleted: count })
	})
	// *  GET /:id get folder by id and corresponding pastes
	.get('/f/:id', userGuard, validatorFolderIdParam, async (c) => {
		const user = c.get('user')
		const { id } = c.req.valid('param')

		// Aggregate folder with counts similar to /all endpoint
		const f = foldersTable
		const sf = alias(foldersTable, 'sf')
		const p = pastesTable

		const row = await db
			.select({
				id: f.id,
				name: f.name,
				parentFolderId: f.parentFolderId,
				createdAt: f.createdAt,
				updatedAt: f.updatedAt,
				userId: f.userId,
				subfoldersCount: sql<number>`COALESCE(CAST(COUNT(DISTINCT ${sf.id}) AS int), 0)`,
				pastesCount: sql<number>`COALESCE(CAST(COUNT(DISTINCT ${p.id}) AS int), 0)`
			})
			.from(f)
			// biome-ignore lint: false positive
			// @ts-ignore
			.leftJoin(sf, eq(sf.parentFolderId, f.id))
			.leftJoin(p, eq(p.folderId, f.id))
			.where(and(eq(f.id, id), eq(f.userId, user.id)))
			.groupBy(f.id)
			.then((res) => res[0])

		if (!row) {
			throw new GenericException({
				statusCode: 404,
				name: 'Not Found',
				message: 'Folder not found'
			})
		}

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
			.where(eq(pastesTable.visibility, 'public'))
			.orderBy(desc(pastesTable.updatedAt))

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
			data: { folder: row, pastes: enrichedPastes }
		})
	})

export type AppType = typeof app
export default app
