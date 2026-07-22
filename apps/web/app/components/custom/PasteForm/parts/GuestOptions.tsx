'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import type { PasteForm as PasteFormValues } from '@/app/types'
import type { PasteFormMode } from '../paste-form-config'

export function GuestOptions({
	isAuthenticated,
	mode
}: {
	isAuthenticated: boolean
	mode: PasteFormMode
}) {
	const { control, register } = useFormContext<PasteFormValues>()
	const visibility = useWatch({ control, name: 'visibility' })

	if (mode === 'edit') return null

	if (!isAuthenticated) {
		return (
			<>
				<div className='divider' />
				<p className='text-sm text-base-content/60'>
					Sign in to access more options like folders and managing
					your pastes.
				</p>
			</>
		)
	}

	return (
		<>
			<div className='divider m-0 p-0'>Anonymous</div>
			<label className='flex items-center gap-2 text-sm'>
				<input
					type='checkbox'
					className='checkbox'
					{...register('pasteAsGuest')}
					name='pasteAsGuest'
					disabled={visibility === 'private'}
				/>
				<span>Paste as guest</span>
			</label>
		</>
	)
}
