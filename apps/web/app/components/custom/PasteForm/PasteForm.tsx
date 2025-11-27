'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import type { Paste, PasteForm as PasteFormType } from '@/app/types'
import { getBaseApiUrl, wait } from '@/app/utils/functions'
import { useSensitiveContentChecker } from '@/app/utils/useSensitiveContentChecker'
import { ContentEditor } from './parts/ContentEditor'
import { DescriptionField } from './parts/DescriptionField'
import { ForkInfo } from './parts/ForkInfo'
import { Header } from './parts/Header'
import { LeftColumn } from './parts/LeftColumn'
import { SensitiveWarningDialog } from './parts/SensitiveWarningDialog'

export function PasteForm({
	mode,
	slug,
	paste,
	type
}: {
	mode: 'create' | 'edit' | 'fork'
	slug?: string
	paste?: Paste
	type?: 'realtime' | 'static'
}) {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const router = useRouter()

	const defaultsForCreate: PasteFormType = {
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
		password: '',
		pasteAsGuest: false,
		tags: []
	}

	const defaultsForEdit: PasteFormType | undefined =
		mode === 'edit' && paste
			? {
					title: paste.title,
					slug: paste.slug,
					description: paste.description,
					content: paste.content,
					syntax: paste.syntax.name,
					category: paste.category,
					expiration: paste.expiration,
					visibility: paste.visibility,
					folder: paste.folderId || 'none',
					passwordEnabled: false,
					password: '',
					pasteAsGuest: false,
					tags: paste.tags
				}
			: undefined

	const isRealtime = type === 'realtime'
	const defaultsForFork: PasteFormType | undefined =
		mode === 'fork' && paste
			? {
					title: `${paste.title || paste.slug}`,
					slug: '',
					description: `Fork of ${isRealtime ? 'realtime paste' : `static paste`} ${paste.slug}. ${paste.description ? `Original description: ${paste.description}` : ''}`,
					content: paste.content,
					syntax: paste.syntax.name,
					category: paste.category,
					expiration: 'never',
					visibility: 'unlisted',
					folder: 'none',
					passwordEnabled: false,
					password: '',
					pasteAsGuest: false,
					tags: paste.tags || []
				}
			: undefined

	const resolvedDefaults =
		defaultsForEdit ?? defaultsForFork ?? defaultsForCreate

	const methods = useForm<PasteFormType>({ defaultValues: resolvedDefaults })
	const { handleSubmit, setValue } = methods

	const {
		showWarning,
		setShowWarning,
		matchedLines,
		checkAndSubmit,
		acceptAndSubmit
	} = useSensitiveContentChecker<PasteFormType>()

	const onSubmit = async (data: PasteFormType) => {
		setIsSubmitting(true)
		const isCreateLike = mode === 'create' || mode === 'fork'
		const endpoint = isCreateLike
			? `${getBaseApiUrl()}/api/pastes`
			: `${getBaseApiUrl()}/api/pastes/${slug}`
		const method = isCreateLike ? 'POST' : 'PUT'

		const res = await fetch(endpoint, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			credentials: 'include'
		})

		const json = await res.json()
		if (res.ok) {
			const successMsg =
				mode === 'edit'
					? 'Paste edited successfully!'
					: mode === 'fork'
						? 'Fork created successfully!'
						: 'Paste created successfully!'

			toast.success(successMsg)
			await wait(1000)
			if (json.data.expiration !== 'burn_after_read') {
				router.push(`/p/${json.data.slug}`)
			} else {
				toast.success(
					'Your paste has expiration set to "burn after read". It will be deleted after you view it. Redirecting in 5 seconds...',
					{ duration: 5000 }
				)
				await wait(5000)
				router.push('/')
			}
		} else {
			toast.error(json.message)
			if (json.details && Array.isArray(json.details)) {
				for (const fieldError of json.details) {
					for (const key in fieldError) {
						const message = fieldError[key]
						// @ts-expect-error dynamic
						methods.setError(key, { type: 'server', message })
					}
				}
			}
		}
	}

	useEffect(() => {
		if (mode === 'edit') {
			const current = paste?.folderId ?? null
			if (current) {
				setValue('folder', current, { shouldValidate: true })
			} else {
				setValue('folder', 'none', { shouldValidate: true })
			}
		}
	}, [mode, paste?.folderId, setValue])

	return (
		<FormProvider {...methods}>
			<form
				onSubmit={handleSubmit((data) =>
					checkAndSubmit(data, onSubmit)
				)}
				className='flex flex-col gap-4 p-5 rounded-lg bg-base-200 mx-auto max-w-8xl'
			>
				<Header
					mode={mode}
					type={type}
					slug={slug}
					pasteSlug={paste?.slug}
				/>

				{mode === 'fork' && paste && (
					<ForkInfo
						type={type}
						slug={paste.slug}
						title={paste.title}
					/>
				)}

				{/* Full-width description above columns */}
				<DescriptionField />

				{/* 2-column layout wrapper (fix): left on the left, content on the right */}
				<div className='flex flex-col lg:flex-row gap-4'>
					{/* Left column */}
					<LeftColumn mode={mode} />

					<div className='divider lg:divider-horizontal' />

					{/* Right column */}
					<div className='w-full lg:w-4/5 flex flex-col gap-4 min-w-0'>
						<ContentEditor />
						<button
							type='submit'
							className='btn btn-primary w-full'
							disabled={isSubmitting}
						>
							{mode === 'fork'
								? `${isSubmitting ? 'Forking...' : 'Create Fork'}`
								: `${isSubmitting ? (mode === 'edit' ? 'Saving...' : 'Creating...') : mode === 'edit' ? 'Save Changes' : 'Submit'}`}
						</button>
					</div>
				</div>
			</form>

			<SensitiveWarningDialog
				isOpen={showWarning}
				onCancel={() => setShowWarning(false)}
				onAccept={() => acceptAndSubmit(onSubmit)}
				matchedLines={matchedLines}
			/>
		</FormProvider>
	)
}
