'use client'

import type { PasteFormMode } from '../paste-form-config'
import { AccessOptions } from './AccessOptions'
import { BasicOptions } from './BasicOptions'
import { FolderOptions } from './FolderOptions'
import { GuestOptions } from './GuestOptions'
import { SyntaxSelect } from './SyntaxSelect'
import { TagsInput } from './TagsInput'

export function LeftColumn({
	mode,
	isAuthenticated
}: {
	mode: PasteFormMode
	isAuthenticated: boolean
}) {
	return (
		<div className='w-full lg:w-1/5 flex flex-col gap-4'>
			<BasicOptions mode={mode} />
			<TagsInput />
			<SyntaxSelect />
			<AccessOptions mode={mode} />
			<FolderOptions mode={mode} isAuthenticated={isAuthenticated} />
			<GuestOptions mode={mode} isAuthenticated={isAuthenticated} />
		</div>
	)
}
