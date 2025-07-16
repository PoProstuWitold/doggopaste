import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { db } from '../db/index.js'
import { realTimePastesTable, syntaxesTable } from '../db/schema.js'
import type { Env, Session } from '../types.js'
import { auth } from '../utils/auth.js'
import { validatorParamStringSlug } from '../utils/schemas.js'

const app = new Hono<Env>().post(
	'/:slug',
	validatorParamStringSlug,
	async (c) => {
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
	}
)

export default app
