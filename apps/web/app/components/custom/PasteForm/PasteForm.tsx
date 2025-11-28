'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FaUnlock } from 'react-icons/fa'
import type { Paste, PasteForm as PasteFormType } from '@/app/types'
import { getBaseApiUrl, wait } from '@/app/utils/functions'
import { useSensitiveContentChecker } from '@/app/utils/useSensitiveContentChecker'
import { decryptWithPassword, encryptWithPassword } from '@/app/utils/webCrypto'
import { CustomDialog } from '../../core/CustomDialog'
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

	const hasServerLock = Boolean(paste?.passwordHash && !paste?.content)
	const hasClientLock = Boolean(paste?.encrypted)

	const [isLocked, setIsLocked] = useState(hasServerLock || hasClientLock)
	const [unlockPassword, setUnlockPassword] = useState('')
	const [isUnlocking, setIsUnlocking] = useState(false)

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
		encrypted: false,
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
					content: isLocked ? '' : paste.content,
					syntax: paste.syntax.name,
					category: paste.category,
					expiration: paste.expiration,
					visibility: paste.visibility,
					folder: paste.folderId || 'none',
					passwordEnabled:
						Boolean(paste.passwordHash) || paste.encrypted,
					encrypted: paste.encrypted,
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
			: undefined

	const resolvedDefaults =
		defaultsForEdit ?? defaultsForFork ?? defaultsForCreate

	const methods = useForm<PasteFormType>({ defaultValues: resolvedDefaults })
	const { handleSubmit, setValue } = methods

	const handleUnlock = async (e?: React.FormEvent) => {
		if (e) e.preventDefault()
		if (!unlockPassword || !paste) return

		setIsUnlocking(true)
		try {
			let contentToProcess = paste.content

			if (hasServerLock) {
				const res = await fetch(
					`${getBaseApiUrl()}/api/pastes/${slug || paste.slug}/verify`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ password: unlockPassword })
					}
				)

				const json = await res.json()

				if (!res.ok) {
					throw new Error(json.message || 'Invalid server password')
				}

				contentToProcess = json.content
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
			setIsLocked(false)
		} catch (error) {
			console.error(error)
			const msg = (error as Error).message || 'Unlock failed'
			toast.error(msg)
			setUnlockPassword('')
		} finally {
			setIsUnlocking(false)
		}
	}

	const {
		showWarning,
		setShowWarning,
		matchedLines,
		checkAndSubmit,
		acceptAndSubmit
	} = useSensitiveContentChecker<PasteFormType>()

	const onSubmit = async (data: PasteFormType) => {
		setIsSubmitting(true)
		const payload = { ...data }

		try {
			if (
				payload.passwordEnabled &&
				payload.encrypted &&
				payload.password
			) {
				const encryptedBody = await encryptWithPassword(
					payload.content,
					payload.password
				)
				payload.content = encryptedBody
				payload.password = undefined
			}

			const isCreateLike = mode === 'create' || mode === 'fork'
			const endpoint = isCreateLike
				? `${getBaseApiUrl()}/api/pastes`
				: `${getBaseApiUrl()}/api/pastes/${slug}`
			const method = isCreateLike ? 'POST' : 'PUT'

			const res = await fetch(endpoint, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
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
					toast.success('Burn after read set. Redirecting...', {
						duration: 5000
					})
					await wait(5000)
					router.push('/')
				}
			} else {
				toast.error(json.message)
				if (json.details && Array.isArray(json.details)) {
					for (const fieldError of json.details) {
						for (const key in fieldError) {
							const message = fieldError[key]
							// @ts-expect-error dynamic key access
							methods.setError(key, { type: 'server', message })
						}
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
			<CustomDialog
				isOpen={isLocked}
				onClose={() => router.back()}
				title={mode === 'edit' ? 'Unlock to Edit' : 'Unlock to Fork'}
				description={
					hasServerLock
						? 'This paste is protected by a server-side password. Please enter it to continue.'
						: 'This paste is encrypted client-side. Please enter the decryption password.'
				}
				btnClasses='hidden'
			>
				<form onSubmit={handleUnlock} className='flex flex-col gap-4'>
					<div className='form-control w-full'>
						<label className='label' htmlFor='password'>
							<span className='label-text font-bold'>
								Password
							</span>
						</label>
						<input
							type='password'
							className='input input-bordered w-full'
							placeholder='Enter password...'
							value={unlockPassword}
							onChange={(e) => setUnlockPassword(e.target.value)}
						/>
					</div>
					<div className='flex justify-between items-center mt-2'>
						<button
							type='button'
							className='btn btn-ghost'
							onClick={() => router.back()}
						>
							Go Back
						</button>
						<button
							type='submit'
							className='btn btn-primary'
							disabled={!unlockPassword || isUnlocking}
						>
							{isUnlocking ? (
								<span className='loading loading-spinner'></span>
							) : (
								<>
									Unlock <FaUnlock />
								</>
							)}
						</button>
					</div>
				</form>
			</CustomDialog>

			<form
				onSubmit={handleSubmit((data) =>
					checkAndSubmit(data, onSubmit)
				)}
				className={`flex flex-col gap-4 p-5 rounded-lg bg-base-200 mx-auto max-w-8xl transition-opacity duration-300 ${isLocked ? 'opacity-20 pointer-events-none blur-sm' : 'opacity-100'}`}
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

				<DescriptionField />

				<div className='flex flex-col lg:flex-row gap-4'>
					<LeftColumn mode={mode} />

					<div className='divider lg:divider-horizontal' />

					<div className='w-full lg:w-4/5 flex flex-col gap-4 min-w-0'>
						<ContentEditor />
						<button
							type='submit'
							className='btn btn-primary w-full'
							disabled={isSubmitting || isLocked}
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
