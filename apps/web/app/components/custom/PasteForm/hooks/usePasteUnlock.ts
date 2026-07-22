'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import type { UseFormSetValue } from 'react-hook-form'
import toast from 'react-hot-toast'
import type {
	ApiErrorDto,
	Paste,
	PasteForm as PasteFormValues,
	VerifyPasteResponse
} from '@/app/types'
import { apiRequest, getApiErrorMessage } from '@/app/utils/api'
import { decryptWithPassword } from '@/app/utils/webCrypto'

interface UsePasteUnlockOptions {
	hasClientLock: boolean
	hasServerLock: boolean
	onUnlocked: () => void
	paste?: Paste
	setValue: UseFormSetValue<PasteFormValues>
	slug?: string
}

export function usePasteUnlock({
	hasClientLock,
	hasServerLock,
	onUnlocked,
	paste,
	setValue,
	slug
}: UsePasteUnlockOptions) {
	const [unlockPassword, setUnlockPassword] = useState('')
	const [isUnlocking, setIsUnlocking] = useState(false)

	const handleUnlock = async (event?: FormEvent<HTMLFormElement>) => {
		event?.preventDefault()
		if (!unlockPassword || !paste) return

		setIsUnlocking(true)
		try {
			let contentToProcess = paste.content

			if (hasServerLock) {
				const result = await apiRequest<
					VerifyPasteResponse | ApiErrorDto
				>(
					`/api/pastes/${encodeURIComponent(slug || paste.slug)}/verify`,
					{
						method: 'POST',
						json: { password: unlockPassword }
					}
				)

				if (!result.ok || !result.data || !('content' in result.data)) {
					throw new Error(
						getApiErrorMessage(
							result.data,
							'Invalid server password'
						)
					)
				}

				contentToProcess = result.data.content
				toast.success('Server password verified!')
			}

			if (hasClientLock) {
				contentToProcess = await decryptWithPassword(
					contentToProcess,
					unlockPassword
				)
				toast.success('Client content decrypted!')
			}

			setValue('content', contentToProcess, { shouldDirty: false })
			setUnlockPassword('')
			onUnlocked()
		} catch (error) {
			console.error(error)
			const message = (error as Error).message || 'Unlock failed'
			toast.error(message)
			setUnlockPassword('')
		} finally {
			setIsUnlocking(false)
		}
	}

	return {
		handleUnlock,
		isUnlocking,
		setUnlockPassword,
		unlockPassword
	}
}
