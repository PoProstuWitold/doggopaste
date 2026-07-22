import { z } from 'zod'
import { REQUEST_LIMITS } from './request-limits.js'
import { realtimeSlugSchema } from './schemas.js'

export const SOCKET_LIMITS = {
	maxHttpBufferSize: REQUEST_LIMITS.jsonBodyBytes,
	maxDocumentLength: REQUEST_LIMITS.paste.content,
	cursorName: 512,
	coordinate: 1_000_000,
	viewport: 100_000,
	maxChangesPerBatch: 1_000,
	orphanedRoom: {
		maxEntries: 1_000,
		maxAttempts: 3,
		retryBaseMs: 1_000,
		ttlMs: 30_000
	},
	rate: {
		joinRoom: { max: 10, windowMs: 60_000 },
		codeChange: { max: 120, windowMs: 10_000 },
		contentSync: { max: 12, windowMs: 60_000 },
		metaSync: { max: 30, windowMs: 60_000 },
		cursorMove: { max: 120, windowMs: 10_000 }
	}
} as const

const legacyRoomField = {
	slug: realtimeSlugSchema.optional()
}

const documentPositionSchema = z
	.number()
	.int()
	.nonnegative()
	.max(REQUEST_LIMITS.paste.content)

export const joinRoomPayloadSchema = z
	.union([
		realtimeSlugSchema.transform((slug) => ({ slug })),
		z.object({ slug: realtimeSlugSchema })
	])
	.transform(({ slug }) => ({ slug }))

const codeChangeSchema = z.object({
	from: documentPositionSchema,
	to: documentPositionSchema,
	insert: z.string().max(REQUEST_LIMITS.paste.content)
})

const batchedCodeChangePayloadSchema = z.object({
	...legacyRoomField,
	changes: z
		.array(codeChangeSchema)
		.min(1)
		.max(SOCKET_LIMITS.maxChangesPerBatch),
	baseRevision: z.number().int().nonnegative()
})

const legacyCodeChangePayloadSchema = z
	.object({
		...legacyRoomField,
		...codeChangeSchema.shape,
		baseRevision: z.number().int().nonnegative()
	})
	.transform(({ slug, baseRevision, from, to, insert }) => ({
		slug,
		baseRevision,
		changes: [{ from, to, insert }]
	}))

export const codeChangePayloadSchema = z.union([
	batchedCodeChangePayloadSchema,
	legacyCodeChangePayloadSchema
])

export const contentSyncPayloadSchema = z.object({
	...legacyRoomField,
	content: z.string().max(REQUEST_LIMITS.paste.content),
	baseRevision: z.number().int().nonnegative()
})

export const metaSyncPayloadSchema = z.object({
	...legacyRoomField,
	title: z.string().max(REQUEST_LIMITS.paste.title),
	syntaxName: z.string().min(1).max(REQUEST_LIMITS.paste.syntax),
	baseRevision: z.number().int().nonnegative()
})

export const cursorMovePayloadSchema = z.object({
	...legacyRoomField,
	x: z.number().finite().nonnegative().max(SOCKET_LIMITS.coordinate),
	y: z.number().finite().nonnegative().max(SOCKET_LIMITS.coordinate),
	name: z.string().min(1).max(SOCKET_LIMITS.cursorName).optional(),
	viewportWidth: z.number().finite().positive().max(SOCKET_LIMITS.viewport),
	viewportHeight: z.number().finite().positive().max(SOCKET_LIMITS.viewport),
	position: documentPositionSchema,
	selection: z.object({
		anchor: documentPositionSchema,
		head: documentPositionSchema
	})
})

export type JoinRoomPayload = z.infer<typeof joinRoomPayloadSchema>
export type CodeChangePayload = z.infer<typeof codeChangePayloadSchema>
export type ContentSyncPayload = z.infer<typeof contentSyncPayloadSchema>
export type MetaSyncPayload = z.infer<typeof metaSyncPayloadSchema>
export type CursorMovePayload = z.infer<typeof cursorMovePayloadSchema>
export type RealtimeCodeChange = z.infer<typeof codeChangeSchema>

export function applyRealtimeCodeChanges(
	content: string,
	changes: readonly RealtimeCodeChange[]
): string | null {
	let nextLength = content.length
	let previousTo = -1
	for (const change of changes) {
		if (
			change.from > change.to ||
			change.to > content.length ||
			change.from < previousTo
		) {
			return null
		}
		previousTo = change.to
		nextLength += change.insert.length - (change.to - change.from)
	}
	if (nextLength < 0 || nextLength > SOCKET_LIMITS.maxDocumentLength) {
		return null
	}

	let nextContent = content
	for (let index = changes.length - 1; index >= 0; index -= 1) {
		const change = changes[index]
		if (!change) continue
		nextContent = `${nextContent.slice(0, change.from)}${change.insert}${nextContent.slice(change.to)}`
	}
	return nextContent
}

export interface RealtimeSocketSyntax {
	name: string
	extension: string | null
	color: string
}

export interface RealtimeSocketSnapshot {
	content: string
	title: string
	syntax: RealtimeSocketSyntax
	revision: number
}

export type SocketAcknowledgement =
	| {
			status: 'success'
			revision?: number
			snapshot?: RealtimeSocketSnapshot
	  }
	| { status: 'validation_error' }
	| { status: 'not_joined' }
	| { status: 'room_mismatch' }
	| { status: 'rate_limited'; retryAfterMs: number }
	| {
			status: 'revision_conflict'
			revision: number
			snapshot: RealtimeSocketSnapshot
	  }
	| { status: 'internal_error' }

export type SocketAcknowledgementCallback = (
	acknowledgement: SocketAcknowledgement
) => void

export type SocketRateLimitEvent = keyof typeof SOCKET_LIMITS.rate
