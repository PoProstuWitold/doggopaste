import type {
	foldersTable,
	realTimePastesTable,
	syntaxesTable
} from '../db/schema.js'

type FolderRecord = typeof foldersTable.$inferSelect
type RealtimePasteRecord = typeof realTimePastesTable.$inferSelect
type SyntaxRecord = typeof syntaxesTable.$inferSelect
type SyntaxSource = Pick<SyntaxRecord, 'id' | 'name' | 'extension' | 'color'>

export const FOLDER_DTO_KEYS = [
	'id',
	'createdAt',
	'updatedAt',
	'name',
	'userId',
	'parentFolderId'
] as const
export const REALTIME_PASTE_DTO_KEYS = [
	'id',
	'createdAt',
	'updatedAt',
	'title',
	'slug',
	'content',
	'syntaxId',
	'visibility',
	'organizationId'
] as const
export const REALTIME_VIEWER_DTO_KEYS = ['name'] as const
export const SYNTAX_DTO_KEYS = ['id', 'name', 'extension', 'color'] as const

export interface FolderDto {
	id: string
	createdAt: Date
	updatedAt: Date
	name: string
	userId: string
	parentFolderId: string | null
}

export interface RealtimePasteDto {
	id: string
	createdAt: Date
	updatedAt: Date
	title: string
	slug: string
	content: string
	syntaxId: string | null
	visibility: RealtimePasteRecord['visibility']
	organizationId: string | null
}

export interface SyntaxDto {
	id: string
	name: string
	extension: string | null
	color: string
}

export function toFolderDto(folder: FolderRecord): FolderDto {
	return {
		id: folder.id,
		createdAt: folder.createdAt,
		updatedAt: folder.updatedAt,
		name: folder.name,
		userId: folder.userId,
		parentFolderId: folder.parentFolderId
	}
}

export function toRealtimePasteDto(
	paste: RealtimePasteRecord
): RealtimePasteDto {
	return {
		id: paste.id,
		createdAt: paste.createdAt,
		updatedAt: paste.updatedAt,
		title: paste.title,
		slug: paste.slug,
		content: paste.content,
		syntaxId: paste.syntaxId,
		visibility: paste.visibility,
		organizationId: paste.organizationId
	}
}

export function toSyntaxDto(syntax: SyntaxSource): SyntaxDto {
	return {
		id: syntax.id,
		name: syntax.name,
		extension: syntax.extension,
		color: syntax.color
	}
}
