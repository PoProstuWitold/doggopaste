import type { Paste, PasteForm as PasteFormValues } from '@/app/types'

export type PasteFormMode = 'create' | 'edit' | 'fork'
export type PasteSourceType = 'realtime' | 'static'

export interface PasteFormProps {
	mode: PasteFormMode
	slug?: string
	paste?: Paste
	type?: PasteSourceType
	isAuthenticated: boolean
}

export interface PasteLockState {
	hasClientLock: boolean
	hasServerLock: boolean
	isInitiallyLocked: boolean
}

export function getPasteLockState(paste?: Paste): PasteLockState {
	const hasServerLock = Boolean(paste?.passwordProtected && !paste?.content)
	const hasClientLock = Boolean(paste?.encrypted)

	return {
		hasClientLock,
		hasServerLock,
		isInitiallyLocked: hasServerLock || hasClientLock
	}
}

export function getPasteFormDefaults({
	mode,
	paste,
	type,
	isLocked
}: Pick<PasteFormProps, 'mode' | 'paste' | 'type'> & {
	isLocked: boolean
}): PasteFormValues {
	if (mode === 'edit' && paste) {
		return {
			title: paste.title,
			slug: paste.slug,
			description: paste.description,
			content: isLocked ? '' : paste.content,
			syntax: paste.syntax.name,
			category: paste.category,
			expiration: paste.expiration,
			visibility: paste.visibility,
			folder: paste.folderId || 'none',
			passwordEnabled: paste.passwordProtected || paste.encrypted,
			encrypted: paste.encrypted,
			password: '',
			pasteAsGuest: false,
			tags: paste.tags
		}
	}

	if (mode === 'fork' && paste) {
		const source = type === 'realtime' ? 'realtime paste' : 'static paste'

		return {
			title: `${paste.title || paste.slug}`,
			slug: '',
			description: `Fork of ${source} ${paste.slug}. ${paste.description ? `Original description: ${paste.description}` : ''}`,
			content: isLocked ? '' : paste.content,
			syntax: paste.syntax.name,
			category: paste.category,
			expiration: 'never',
			visibility: 'unlisted',
			folder: 'none',
			passwordEnabled: false,
			encrypted: false,
			password: '',
			pasteAsGuest: false,
			tags: paste.tags || []
		}
	}

	return {
		title: '',
		slug: '',
		description: '',
		content: '',
		syntax: 'Plaintext',
		category: 'none',
		expiration: 'never',
		visibility: 'public',
		folder: 'none',
		passwordEnabled: false,
		encrypted: false,
		password: '',
		pasteAsGuest: false,
		tags: []
	}
}
