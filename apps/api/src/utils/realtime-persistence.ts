import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { realTimePastesTable, syntaxesTable } from '../db/schema.js'
import type {
	RealtimeSocketSnapshot,
	RealtimeSocketSyntax
} from './socket-contract.js'

export const plaintextRealtimeSyntax: RealtimeSocketSyntax = {
	name: 'Plaintext',
	extension: 'txt',
	color: '#808080'
}

type RealtimeSyntaxRow = {
	name: string | null
	extension: string | null
	color: string | null
} | null

export function toRealtimeSocketSyntax(
	syntax: RealtimeSyntaxRow
): RealtimeSocketSyntax {
	if (!syntax?.name || !syntax.color) return plaintextRealtimeSyntax

	return {
		name: syntax.name,
		extension: syntax.extension,
		color: syntax.color
	}
}

export async function loadRealtimeSocketSnapshot(
	slug: string
): Promise<RealtimeSocketSnapshot | null> {
	const [row] = await db
		.select({
			content: realTimePastesTable.content,
			title: realTimePastesTable.title,
			revision: realTimePastesTable.revision,
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

	if (!row) return null

	return {
		content: row.content,
		title: row.title,
		revision: row.revision,
		syntax: toRealtimeSocketSyntax(row.syntax)
	}
}

export type RealtimeContentSaveResult =
	| { status: 'success'; revision: number }
	| { status: 'revision_conflict'; snapshot: RealtimeSocketSnapshot }
	| { status: 'missing' }

export async function saveRealtimeContent(
	slug: string,
	content: string,
	baseRevision: number
): Promise<RealtimeContentSaveResult> {
	const [updated] = await db
		.update(realTimePastesTable)
		.set({
			content,
			revision: sql`${realTimePastesTable.revision} + 1`,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(realTimePastesTable.slug, slug),
				eq(realTimePastesTable.revision, baseRevision)
			)
		)
		.returning({ revision: realTimePastesTable.revision })

	if (updated) return { status: 'success', revision: updated.revision }

	const snapshot = await loadRealtimeSocketSnapshot(slug)
	return snapshot
		? { status: 'revision_conflict', snapshot }
		: { status: 'missing' }
}

export type RealtimeMetadataSaveResult =
	| {
			status: 'success'
			revision: number
			title: string
			syntax: RealtimeSocketSyntax
	  }
	| { status: 'revision_conflict'; snapshot: RealtimeSocketSnapshot }
	| { status: 'invalid_syntax' }
	| { status: 'missing' }

export async function saveRealtimeMetadata(
	slug: string,
	title: string,
	syntaxName: string,
	baseRevision: number
): Promise<RealtimeMetadataSaveResult> {
	const [syntax] = await db
		.select({
			id: syntaxesTable.id,
			name: syntaxesTable.name,
			extension: syntaxesTable.extension,
			color: syntaxesTable.color
		})
		.from(syntaxesTable)
		.where(eq(syntaxesTable.name, syntaxName))

	if (!syntax) return { status: 'invalid_syntax' }

	const resolvedTitle = title || slug
	const [updated] = await db
		.update(realTimePastesTable)
		.set({
			title: resolvedTitle,
			syntaxId: syntax.id,
			revision: sql`${realTimePastesTable.revision} + 1`,
			updatedAt: new Date()
		})
		.where(
			and(
				eq(realTimePastesTable.slug, slug),
				eq(realTimePastesTable.revision, baseRevision)
			)
		)
		.returning({ revision: realTimePastesTable.revision })

	if (updated) {
		return {
			status: 'success',
			revision: updated.revision,
			title: resolvedTitle,
			syntax: toRealtimeSocketSyntax(syntax)
		}
	}

	const snapshot = await loadRealtimeSocketSnapshot(slug)
	return snapshot
		? { status: 'revision_conflict', snapshot }
		: { status: 'missing' }
}
