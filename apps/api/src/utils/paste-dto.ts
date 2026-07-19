import { sql } from 'drizzle-orm'
import { pastesTable } from '../db/schema.js'

type PasteRecord = typeof pastesTable.$inferSelect

export interface PasteSyntaxDto {
	name: string
	extension: string | null
	color: string
}

export interface PasteSummaryDto {
	id: string
	createdAt: Date
	updatedAt: Date
	userId: string | null
	folderId: string | null
	title: string
	description: string
	slug: string
	category: PasteRecord['category']
	expiresAt: Date | null
	expiration: PasteRecord['expiration']
	encrypted: boolean
	passwordProtected: boolean
	hits: number
	visibility: PasteRecord['visibility']
	tags: string[]
	syntax: PasteSyntaxDto
}

export interface PasteDetailsDto extends PasteSummaryDto {
	content: string
}

type PasteSummarySource = Pick<
	PasteRecord,
	| 'id'
	| 'createdAt'
	| 'updatedAt'
	| 'userId'
	| 'folderId'
	| 'title'
	| 'description'
	| 'slug'
	| 'category'
	| 'expiresAt'
	| 'expiration'
	| 'encrypted'
	| 'hits'
	| 'visibility'
> & {
	passwordProtected: boolean
}

type PasteDetailsSource = PasteSummarySource & Pick<PasteRecord, 'content'>

type NullableSyntax = {
	name: string | null
	extension: string | null
	color: string | null
}

export const pasteSummarySelection = {
	id: pastesTable.id,
	createdAt: pastesTable.createdAt,
	updatedAt: pastesTable.updatedAt,
	userId: pastesTable.userId,
	folderId: pastesTable.folderId,
	title: pastesTable.title,
	description: pastesTable.description,
	slug: pastesTable.slug,
	category: pastesTable.category,
	expiresAt: pastesTable.expiresAt,
	expiration: pastesTable.expiration,
	encrypted: pastesTable.encrypted,
	passwordProtected: sql<boolean>`${pastesTable.passwordHash} IS NOT NULL`,
	hits: pastesTable.hits,
	visibility: pastesTable.visibility
}

export const pasteDetailsSelection = {
	...pasteSummarySelection,
	content: pastesTable.content
}

function toSyntaxDto(syntax: NullableSyntax | null): PasteSyntaxDto {
	return {
		name: syntax?.name ?? 'Plaintext',
		extension: syntax?.extension ?? 'txt',
		color: syntax?.color ?? '#808080'
	}
}

export function toPasteSummaryDto(
	paste: PasteSummarySource,
	syntax: NullableSyntax | null,
	tags: string[]
): PasteSummaryDto {
	return {
		id: paste.id,
		createdAt: paste.createdAt,
		updatedAt: paste.updatedAt,
		userId: paste.userId,
		folderId: paste.folderId,
		title: paste.title,
		description: paste.description ?? '',
		slug: paste.slug ?? '',
		category: paste.category,
		expiresAt: paste.expiresAt,
		expiration: paste.expiration,
		encrypted: paste.encrypted ?? false,
		passwordProtected: paste.passwordProtected,
		hits: paste.hits,
		visibility: paste.visibility,
		tags,
		syntax: toSyntaxDto(syntax)
	}
}

export function toPasteDetailsDto(
	paste: PasteDetailsSource,
	syntax: NullableSyntax | null,
	tags: string[],
	includeContent: boolean
): PasteDetailsDto {
	return {
		...toPasteSummaryDto(paste, syntax, tags),
		content: includeContent ? paste.content : ''
	}
}

export function pasteRecordToDetailsSource(
	paste: PasteRecord
): PasteDetailsSource {
	return {
		id: paste.id,
		createdAt: paste.createdAt,
		updatedAt: paste.updatedAt,
		userId: paste.userId,
		folderId: paste.folderId,
		title: paste.title,
		description: paste.description,
		slug: paste.slug,
		category: paste.category,
		expiresAt: paste.expiresAt,
		expiration: paste.expiration,
		encrypted: paste.encrypted,
		passwordProtected: paste.passwordHash !== null,
		hits: paste.hits,
		visibility: paste.visibility,
		content: paste.content
	}
}
