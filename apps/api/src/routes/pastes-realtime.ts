import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/index.js'
import { realTimePastesTable, syntaxesTable } from '../db/schema.js'
import { GenericException } from '../exceptions/generic-exception.js'
import type { Env, Session } from '../types.js'
import { auth } from '../utils/auth.js'
import { DoggoUtils } from '../utils/doggo-utils.js'
import { validatorParamStringSlug } from '../utils/schemas.js'

const app = new Hono<Env>()
	.post('/:slug', validatorParamStringSlug, async (c) => {
		const { slug } = c.req.valid('param')

		let session = null
		let token: string | undefined

		try {
			const body = await c.req.json()
			token = body?.token
		} catch {
			// no body or invalid JSON, in this case it can be ignored
		}

		if (token) {
			try {
				const verifyResponse = await auth.api.verifyOneTimeToken({
					body: { token },
					asResponse: true
				})
				const data: Session = (await verifyResponse.json()) as Session
				if (data.session) session = data ?? null
			} catch (err) {
				console.warn('Token verification failed, ignoring:', err)
			}
		}

		// look for existing paste by slug
		// if it exists, return it
		const [existingPaste] = await db
			.select()
			.from(realTimePastesTable)
			.where(eq(realTimePastesTable.slug, slug))

		let paste = existingPaste

		// if paste does not exist, create a new one
		// with the given slug and default values
		if (!paste) {
			// Get default syntaxId by name
			const [defaultSyntax] = await db
				.select({ id: syntaxesTable.id })
				.from(syntaxesTable)
				.where(eq(syntaxesTable.name, 'Plaintext'))

			const syntaxId = defaultSyntax?.id ?? null

			// Insert new realtime paste
			await db.insert(realTimePastesTable).values({
				slug,
				title: slug,
				content: '',
				syntaxId,
				visibility: 'public'
			})

			const [newPaste] = await db
				.select()
				.from(realTimePastesTable)
				.where(eq(realTimePastesTable.slug, slug))

			paste = newPaste
		}

		// Populate syntax details
		let syntax = null
		if (paste.syntaxId) {
			const [foundSyntax] = await db
				.select()
				.from(syntaxesTable)
				.where(eq(syntaxesTable.id, paste.syntaxId))
			syntax = foundSyntax ?? null
		}

		return c.json({
			success: true,
			realtimePaste: {
				...paste,
				syntax
			},
			session
		})
	})
	.get('/:slug/download', validatorParamStringSlug, async (c) => {
		const { slug } = c.req.valid('param')

		// 1. Get realtime paste with syntax extension
		const [row] = await db
			.select({
				paste: realTimePastesTable,
				syntax: {
					extension: syntaxesTable.extension
				}
			})
			.from(realTimePastesTable)
			.leftJoin(
				syntaxesTable,
				eq(realTimePastesTable.syntaxId, syntaxesTable.id)
			)
			.where(eq(realTimePastesTable.slug, slug))

		if (!row) {
			throw new GenericException({
				statusCode: 404,
				name: 'Not Found',
				message: 'Paste not found'
			})
		}

		const paste = row.paste
		const extension = row.syntax.extension

		// 2. Filename
		const safeTitle = DoggoUtils.sanitizeFileName(paste.title)
		const fileName = `${safeTitle}.${extension}`

		// 3. Headers + response
		c.header('Content-Type', 'text/plain; charset=utf-8')
		c.header('Content-Disposition', `attachment; filename="${fileName}"`)
		return c.body(paste.content)
	})
	.get('/:slug', validatorParamStringSlug, async (c) => {
		const { slug } = c.req.valid('param')

		const [row] = await db
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
			.where(eq(realTimePastesTable.slug, slug))

		if (!row) {
			throw new GenericException({
				statusCode: 404,
				name: 'Not Found',
				message: 'Paste not found'
			})
		}

		const paste = row.paste
		const syntax = row.syntax

		const enrichedPaste = {
			...paste,
			syntax
		}

		return c.json({
			success: true,
			data: enrichedPaste
		})
	})

export type AppType = typeof app
export default app
