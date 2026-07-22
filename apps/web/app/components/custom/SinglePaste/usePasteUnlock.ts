'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import type { ApiErrorDto, Paste, VerifyPasteResponse } from '../../../types'
import { apiRequest, getApiErrorMessage } from '../../../utils/api'
import { decryptWithPassword } from '../../../utils/webCrypto'

export function usePasteUnlock(slug: string, paste: Paste) {
	const [isServerLocked, setIsServerLocked] = useState(
		paste.passwordProtected && !paste.content
	)
	const [isClientLocked, setIsClientLocked] = useState(paste.encrypted)
	const [fetchedContent, setFetchedContent] = useState<string>(paste.content)
	const [decryptedContent, setDecryptedContent] = useState<string | null>(
		null
	)
	const [passwordInput, setPasswordInput] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)

	const handleUnlock = async (event?: React.FormEvent) => {
		if (event) event.preventDefault()
		if (!passwordInput) return

		setIsProcessing(true)

		try {
			if (isServerLocked) {
				const result = await apiRequest<
					VerifyPasteResponse | ApiErrorDto
				>(`/api/pastes/${encodeURIComponent(slug)}/verify`, {
					method: 'POST',
					json: { password: passwordInput }
				})

				if (!result.ok || !result.data || !('content' in result.data)) {
					throw new Error(
						getApiErrorMessage(
							result.data,
							'Invalid server password'
						)
					)
				}

				const realContent = result.data.content
				setFetchedContent(realContent)
				setIsServerLocked(false)
				toast.success('Server password verified!')

				if (paste.encrypted) {
					try {
						const clearText = await decryptWithPassword(
							realContent,
							passwordInput
						)
						setDecryptedContent(clearText)
						setIsClientLocked(false)
						toast.success(
							'Client encryption unlocked automatically!'
						)
					} catch {
						setPasswordInput('')
						toast(
							'Server unlocked. Please enter encryption password.'
						)
					}
				}

				setPasswordInput('')
			} else if (isClientLocked) {
				const clearText = await decryptWithPassword(
					fetchedContent,
					passwordInput
				)
				setDecryptedContent(clearText)
				setIsClientLocked(false)
				setPasswordInput('')
				toast.success('Content decrypted successfully!')
			}
		} catch (error) {
			console.error(error)
			toast.error((error as Error).message || 'Unlock failed')
			if (!isServerLocked) setPasswordInput('')
		} finally {
			setIsProcessing(false)
		}
	}

	const content = paste.encrypted ? decryptedContent || '' : fetchedContent

	return {
		content,
		handleUnlock,
		isClientLocked,
		isProcessing,
		isServerLocked,
		passwordInput,
		setPasswordInput,
		showLockScreen: isServerLocked || isClientLocked
	}
}
