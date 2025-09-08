'use client'

import CodeMirror from '@uiw/react-codemirror'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FaCodeBranch, FaFileCode } from 'react-icons/fa'
import { IoIosClose } from 'react-icons/io'
import { useTheme } from '../../context/ThemeContext'
import type { Paste, PasteForm as PasteFormType } from '../../types'
import {
	categories,
	extensions,
	getBaseApiUrl,
	wait
} from '../../utils/functions'
import { useSensitiveContentChecker } from '../../utils/useSensitiveContentChecker'
import { CustomDialog } from '../core/CustomDialog'

export function PasteForm({
	mode,
	slug,
	paste
}: {
	mode: 'create' | 'edit' | 'fork'
	slug?: string
	paste?: Paste
}) {
	const {
		showWarning,
		setShowWarning,
		matchedLines,
		checkAndSubmit,
		acceptAndSubmit
	} = useSensitiveContentChecker<PasteFormType>()
	const handleCheckAndSubmit = (data: PasteFormType) => {
		checkAndSubmit(data, onSubmit)
	}
	const handleRiskAccept = () => {
		acceptAndSubmit(onSubmit)
	}

	const { cmTheme } = useTheme()
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

	// Fork = we copy content/syntax/kategorię/tags, but:
	// - empty slug
	// - title with prefix
	// - visibility: unlisted (safer)
	// - expiration: never
	const defaultsForFork: PasteFormType | undefined =
		mode === 'fork' && paste
			? {
					title: `${paste.title || paste.slug}`,
					slug: '',
					description: `Fork of ${paste.slug}. ${paste.description ? `Original description: ${paste.description}` : ''}`,
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

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
		setValue,
		setError,
		control
	} = useForm<PasteFormType>({ defaultValues: resolvedDefaults })

	const syntax = watch('syntax')
	const passwordEnabled = watch('passwordEnabled')
	const tags = watch('tags', paste?.tags ?? [])
	const description = watch('description', '') || ''
	const descLen = description.length

	const addTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
		const isAllowed =
			/^[a-z0-9]$/.test(event.key) ||
			[
				'Backspace',
				'Enter',
				'Tab',
				',',
				'ArrowLeft',
				'ArrowRight'
			].includes(event.key)

		if (!isAllowed) {
			event.preventDefault()
		}

		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault()
			const value = event.currentTarget.value.trim()

			if (!/^[a-z]/.test(value)) {
				toast.error('Tag must start with a letter')
				return
			}

			if (value.length > 16) {
				toast.error('Tag is too long (max 16 characters)')
				return
			}

			if (value && !tags.includes(value)) {
				const updatedTags = [...tags, value]
				setValue('tags', updatedTags, { shouldValidate: true })
			}
			event.currentTarget.value = ''
		}
	}

	const removeTag = (tag: string) => {
		const updatedTags = tags.filter((t) => t !== tag)
		setValue('tags', updatedTags, { shouldValidate: true })
	}

	const onSubmit = async (data: PasteFormType) => {
		// we treat fork like create
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
						setError(key as keyof PasteFormType, {
							type: 'server',
							message
						})
					}
				}
			}
		}
	}

	return (
		<>
			<form
				onSubmit={handleSubmit(handleCheckAndSubmit)}
				className='flex flex-col gap-4 p-5 rounded-lg shadow-xl bg-base-200 mx-auto max-w-7xl'
			>
				<div className='flex flex-row items-center text-3xl font-bold text-center gap-4 justify-center'>
					{mode === 'fork' ? (
						<>
							<FaCodeBranch className='w-10 h-10' />
							{`Fork Paste "${paste?.slug || slug || ''}"`}
						</>
					) : (
						<>
							<FaFileCode className='w-10 h-10' />
							{mode === 'create'
								? 'Create New Static Paste'
								: `Edit Static Paste "${slug}"`}
						</>
					)}
				</div>

				{mode === 'fork' && paste && (
					<div className='alert alert-info'>
						<FaCodeBranch className='w-5 h-5' />
						<span>
							Forked from{' '}
							<Link
								target='_blank'
								className='link'
								href={`/p/${paste.slug}`}
							>
								{paste.title || paste.slug}
							</Link>
							. You can edit anything before creating your fork.
						</span>
					</div>
				)}
				<label className='form-control w-full'>
					<div className='label justify-between items-center'>
						<span className='label-text'>Description</span>
						<span
							className={`label-text-alt ${descLen > 255 ? 'text-error' : 'opacity-70'}`}
							aria-live='polite'
						>
							{descLen}/255
						</span>
					</div>

					<textarea
						{...register('description', {
							maxLength: {
								value: 255,
								message: 'Max 255 characters'
							}
						})}
						className='textarea textarea-bordered w-full'
						placeholder='Paste Description'
						name='description'
					/>

					{errors.description && (
						<p className='text-error'>
							{errors.description.message ||
								'Description is required'}
						</p>
					)}
				</label>
				<div className='flex flex-col lg:flex-row gap-4'>
					<div className='w-full lg:w-1/5 flex flex-col gap-4'>
						<label className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>Name / Title</span>
							</div>
							<input
								{...register('title', { required: true })}
								type='text'
								className='input input-bordered w-full'
								placeholder='Paste Title'
								name='title'
							/>
							{errors.title && (
								<p className='text-error'>
									{errors.title.message ||
										'Title is required'}
								</p>
							)}
						</label>

						<label className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>Slug</span>
							</div>
							<input
								{...register('slug')}
								type='text'
								className='input input-bordered w-full'
								placeholder='Paste Slug'
								name='slug'
							/>
							{errors.slug && (
								<p className='text-error'>
									{errors.slug.message}
								</p>
							)}
							{mode === 'fork' && (
								<p className='text-xs text-base-content/60'>
									Leaving slug empty will auto-generate a new
									one for the fork.
								</p>
							)}
						</label>

						<label className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>Category</span>
							</div>
							<select
								{...register('category')}
								className='select select-bordered w-full'
							>
								{categories.map(([value, label]) => (
									<option key={value} value={value}>
										{label}
									</option>
								))}
							</select>
						</label>

						<label className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>
									Tags (Comma or Enter separated)
								</span>
							</div>
							<div className='flex flex-wrap gap-2'>
								{tags.map((tag, index) => (
									<span
										key={`${index}:${tag}`}
										className='badge badge-accent flex items-center'
									>
										<span>#{tag}</span>
										{/* button breaks functionality for some reason */}
										{/* biome-ignore lint: Has to be span, no button */}
										<span
											className='cursor-pointer text-error'
											onClick={(e) => {
												e.stopPropagation()
												removeTag(tag)
											}}
											// has to be that way so linter
											// is happy
											onKeyDown={(_e) => {}}
										>
											<IoIosClose className='w-8 h-8' />
										</span>
									</span>
								))}
							</div>
							<input
								type='text'
								maxLength={16}
								placeholder='Enter tag'
								className='input input-bordered w-full mt-2'
								onKeyDown={addTag}
								name='tags'
							/>
						</label>

						<label className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>
									Syntax Highlighting
								</span>
							</div>
							<select
								{...register('syntax')}
								className='select select-bordered w-full'
							>
								{Object.keys(extensions).map((lang) => (
									<option key={lang} value={lang}>
										{lang}
									</option>
								))}
							</select>
						</label>

						<label className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>
									Paste Expiration
								</span>
							</div>
							<select
								{...register('expiration')}
								className='select select-bordered w-full'
							>
								<option value='never'>Never</option>
								<option value='burn_after_read'>
									Burn after read
								</option>
								<option value='10m'>10 Minutes</option>
								<option value='1h'>1 Hour</option>
								<option value='1d'>1 Day</option>
								<option value='1w'>1 Week</option>
								<option value='2w'>2 Weeks</option>
							</select>
						</label>

						<label className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>
									Paste Visibility
								</span>
							</div>
							<select
								{...register('visibility')}
								className='select select-bordered w-full'
							>
								<option value='public'>Public</option>
								<option value='private'>Private</option>
								<option value='unlisted'>Unlisted</option>
							</select>
							{mode === 'fork' && (
								<p className='text-xs text-base-content/60'>
									Fork defaults to <b>Unlisted</b> to avoid
									leaking private data.
								</p>
							)}
						</label>

						<label className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>Folder</span>
							</div>
							<select
								{...register('folder')}
								className='select select-bordered w-full'
							>
								<option value='none'>No Folder Selected</option>
							</select>
						</label>

						<label className='flex items-center gap-2'>
							<input
								type='checkbox'
								className='checkbox'
								{...register('passwordEnabled')}
								name='passwordEnabled'
							/>
							<span>Password Protect?</span>
						</label>

						{passwordEnabled && (
							<input
								{...register('password')}
								type='password'
								className='input input-bordered w-full'
								placeholder='Password'
								name='password'
							/>
						)}

						<label className='flex items-center gap-2'>
							<input
								type='checkbox'
								className='checkbox'
								{...register('pasteAsGuest')}
								name='pasteAsGuest'
							/>
							<span>Paste as guest</span>
						</label>
					</div>

					<div className='divider lg:divider-horizontal' />

					<div className='w-full lg:w-4/5 flex flex-col gap-4 min-w-0'>
						<div className='form-control w-full flex-1 min-w-0'>
							<div className='label'>
								<span className='label-text flex md:flex-row gap-2'>
									Content{' '}
									{errors.content && (
										<p className='text-error'>
											{errors.content.message}
										</p>
									)}
								</span>
							</div>
							<div className='min-w-0'>
								<Controller
									name='content'
									control={control}
									render={({ field }) => (
										<CodeMirror
											value={field.value}
											extensions={[
												extensions[
													syntax as keyof typeof extensions
												]
											]}
											onChange={field.onChange}
											basicSetup={{
												lineNumbers: true,
												highlightActiveLine: true,
												highlightActiveLineGutter: true,
												foldGutter: true,
												tabSize: 4,
												history: true,
												syntaxHighlighting: true
											}}
											className='overflow-auto h-[650px]'
											theme={cmTheme}
										/>
									)}
								/>
							</div>
						</div>
						<button
							type='submit'
							className='btn btn-primary w-full'
						>
							{mode === 'fork' ? 'Create Fork' : 'Submit'}
						</button>
					</div>
				</div>
			</form>
			{showWarning && (
				<CustomDialog
					isOpen={showWarning}
					onClose={() => setShowWarning(false)}
					title='Potential sensitive content detected'
					description='Your paste may contain secrets. Proceed only if you are sure.'
					btnClasses='hidden'
				>
					<ul className='list-disc ml-5'>
						{matchedLines.map(({ word, lines }) => (
							<li
								key={`${word}-${lines[0]}`}
								className='text-error font-semibold'
							>
								{word} (lines {lines.join(', ')})
							</li>
						))}
					</ul>

					<div className='flex justify-end gap-2 mt-4'>
						<button
							className='btn'
							type='button'
							onClick={() => setShowWarning(false)}
						>
							Cancel
						</button>
						<button
							className='btn btn-error btn-outline'
							onClick={handleRiskAccept}
							type='button'
						>
							I accept the risk
						</button>
					</div>
				</CustomDialog>
			)}
		</>
	)
}
