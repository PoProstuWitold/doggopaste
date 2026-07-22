'use client'

import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import type { PasteForm as PasteFormValues } from '@/app/types'
import type { PasteFormMode } from '../paste-form-config'
import { ExpirationSelect } from './ExpirationSelect'
import { PasswordSection } from './PasswordSection'
import { VisibilitySelect } from './VisibilitySelect'

export function AccessOptions({ mode }: { mode: PasteFormMode }) {
	const { control, setValue } = useFormContext<PasteFormValues>()
	const visibility = useWatch({ control, name: 'visibility' })

	useEffect(() => {
		if (visibility === 'private') {
			setValue('pasteAsGuest', false)
		}
	}, [setValue, visibility])

	return (
		<>
			<ExpirationSelect />
			<VisibilitySelect mode={mode} />
			<div className='divider m-0 p-0'>Password</div>
			<PasswordSection />
		</>
	)
}
