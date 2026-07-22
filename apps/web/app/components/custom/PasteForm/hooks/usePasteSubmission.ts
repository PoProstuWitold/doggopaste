'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { FieldPath, UseFormReturn } from 'react-hook-form'
import toast from 'react-hot-toast'
import type {
	ApiErrorDto,
	PasteForm as PasteFormValues,
	PasteResponse
} from '@/app/types'
import { apiRequest, getApiErrorMessage } from '@/app/utils/api'
import { wait } from '@/app/utils/functions'
import { encryptWithPassword } from '@/app/utils/webCrypto'
import type { PasteFormMode } from '../paste-form-config'

interface UsePasteSubmissionOptions {
	methods: UseFormReturn<PasteFormValues>
	mode: PasteFormMode
	slug?: string
}

async function preparePastePayload(
	data: PasteFormValues
): Promise<PasteFormValues> {
	const payload = { ...data }

	if (payload.passwordEnabled && payload.encrypted && payload.password) {
		payload.content = await encryptWithPassword(
			payload.content,
			payload.password
		)
		payload.password = undefined
	}

	return payload
}

function getPasteRequest(mode: PasteFormMode, slug?: string) {
	const isCreateLike = mode === 'create' || mode === 'fork'

	return {
		endpoint: isCreateLike
			? '/api/pastes'
			: `/api/pastes/${encodeURIComponent(slug ?? '')}`,
		method: isCreateLike ? 'POST' : 'PUT'
	} as const
}

function getSuccessMessage(mode: PasteFormMode): string {
	if (mode === 'edit') return 'Paste edited successfully!'
	if (mode === 'fork') return 'Fork created successfully!'
	return 'Paste created successfully!'
}

export function usePasteSubmission({
	methods,
	mode,
	slug
}: UsePasteSubmissionOptions) {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const router = useRouter()

	const submit = async (data: PasteFormValues) => {
		setIsSubmitting(true)

		try {
			const payload = await preparePastePayload(data)
			const { endpoint, method } = getPasteRequest(mode, slug)
			const result = await apiRequest<PasteResponse | ApiErrorDto>(
				endpoint,
				{
					method,
					json: payload
				}
			)
			const response = result.data

			if (result.ok && response && 'data' in response) {
				toast.success(getSuccessMessage(mode))
				await wait(1000)

				if (response.data.expiration !== 'burn_after_read') {
					router.push(`/p/${response.data.slug}`)
				} else {
					toast.success('Burn after read set. Redirecting...', {
						duration: 5000
					})
					await wait(5000)
					router.push('/')
				}
				return
			}

			toast.error(getApiErrorMessage(response, 'Paste request failed'))
			const details =
				response && 'details' in response ? response.details : undefined
			if (details && Array.isArray(details)) {
				for (const fieldError of details) {
					for (const key in fieldError) {
						methods.setError(key as FieldPath<PasteFormValues>, {
							type: 'server',
							message: fieldError[key]
						})
					}
				}
			}
		} catch (error) {
			console.error('Error:', error)
			toast.error('An error occurred.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return { isSubmitting, submit }
}
