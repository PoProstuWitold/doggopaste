import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/index.js'
import { realTimePastesTable, syntaxesTable } from '../db/schema.js'
import { GenericException } from '../exceptions/generic-exception.js'
import type { Env, RealtimeViewerDto } from '../types.js'
import { auth } from '../utils/auth.js'
import { DoggoUtils } from '../utils/doggo-utils.js'
import { toRealtimePasteDto } from '../utils/response-dto.js'
import { validatorParamRealtimeSlug } from '../utils/schemas.js'

type NullableRealtimeSyntax = {
	name: string | null
	extension: string | null
	color: string | null
} | null

const plaintextSyntax = {
	name: 'Plaintext',
	extension: 'txt',
	color: '#808080'
}

export function toRealtimeViewerDto(value: unknown): RealtimeViewerDto | null {
	if (!value || typeof value !== 'object') return null

	const candidate = value as {
		session?: unknown
		user?: { name?: unknown }
	}

	if (!candidate.session || typeof candidate.user?.name !== 'string') {
		return null
	}

	return { name: candidate.user.name }
}

function toRealtimeSyntax(syntax: NullableRealtimeSyntax) {
	if (!syntax?.name || !syntax.color) return plaintextSyntax

	return {
		name: syntax.name,
		extension: syntax.extension,
		color: syntax.color
	}
}

const app = new Hono<Env>()
	.post('/:slug', validatorParamRealtimeSlug, async (c) => {
		const { slug } = c.req.valid('param')

		let viewer: RealtimeViewerDto | null = null
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
				viewer = toRealtimeViewerDto(await verifyResponse.json())
			} catch {
				console.warn(
					'Token verification failed; continuing without a session'
				)
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

			// A concurrent request may create the same slug after the initial SELECT.
			const [insertedPaste] = await db
				.insert(realTimePastesTable)
				.values({
					slug,
					title: slug,
					content: '',
					syntaxId,
					visibility: 'public'
				})
				.onConflictDoNothing({ target: realTimePastesTable.slug })
				.returning()

			if (insertedPaste) {
				paste = insertedPaste
			} else {
				const [concurrentlyCreatedPaste] = await db
					.select()
					.from(realTimePastesTable)
					.where(eq(realTimePastesTable.slug, slug))

				paste = concurrentlyCreatedPaste
			}
		}

		if (!paste) {
			throw new Error(
				'Failed to resolve realtime paste after insert conflict'
			)
		}

		// Populate syntax details
		let syntax: NullableRealtimeSyntax = null
		if (paste.syntaxId) {
			const [foundSyntax] = await db
				.select({
					name: syntaxesTable.name,
					extension: syntaxesTable.extension,
					color: syntaxesTable.color
				})
				.from(syntaxesTable)
				.where(eq(syntaxesTable.id, paste.syntaxId))
			syntax = foundSyntax ?? null
		}

		return c.json({
			success: true,
			realtimePaste: {
				...toRealtimePasteDto(paste),
				syntax: toRealtimeSyntax(syntax)
			},
			viewer
		})
	})
	.get('/:slug/download', validatorParamRealtimeSlug, async (c) => {
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
		const extension = row.syntax?.extension || 'txt'

		// 2. Filename
		const safeTitle = DoggoUtils.sanitizeFileName(paste.title)
		const fileName = `${safeTitle}.${extension}`

		// 3. Headers + response
		c.header('Content-Type', 'text/plain; charset=utf-8')
		c.header('Content-Disposition', `attachment; filename="${fileName}"`)
		return c.body(paste.content)
	})
	.get('/:slug', validatorParamRealtimeSlug, async (c) => {
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
		const syntax = toRealtimeSyntax(row.syntax)

		const enrichedPaste = {
			...toRealtimePasteDto(paste),
			syntax
		}

		return c.json({
			success: true,
			data: enrichedPaste
		})
	})

export type AppType = typeof app
export default app
