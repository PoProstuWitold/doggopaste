'use client'

import type { PasteFormMode } from '../paste-form-config'
import { FolderSelector } from './FolderSelector'

export function FolderOptions({
	isAuthenticated,
	mode
}: {
	isAuthenticated: boolean
	mode: PasteFormMode
}) {
	if (!isAuthenticated && mode !== 'edit') return null

	return (
		<>
			<div className='divider m-0 p-0'>Folders</div>
			<FolderSelector />
		</>
	)
}
