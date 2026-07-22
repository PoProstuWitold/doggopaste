'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { PasteForm as PasteFormValues } from '@/app/types'
import {
	getPasteFormDefaults,
	getPasteLockState,
	type PasteFormProps
} from '../paste-form-config'

export function usePasteFormState({
	mode,
	paste,
	type
}: Pick<PasteFormProps, 'mode' | 'paste' | 'type'>) {
	const lockState = getPasteLockState(paste)
	const [isLocked, setIsLocked] = useState(lockState.isInitiallyLocked)
	const methods = useForm<PasteFormValues>({
		defaultValues: getPasteFormDefaults({
			mode,
			paste,
			type,
			isLocked
		})
	})

	const { setValue } = methods
	useEffect(() => {
		if (mode !== 'edit') return

		const currentFolder = paste?.folderId ?? null
		setValue('folder', currentFolder || 'none', {
			shouldValidate: true
		})
	}, [mode, paste?.folderId, setValue])

	return {
		...lockState,
		isLocked,
		methods,
		setIsLocked
	}
}
