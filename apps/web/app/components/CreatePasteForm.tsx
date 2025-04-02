'use client'

import CodeMirror from '@uiw/react-codemirror'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { FaFileCode } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import type { PasteForm } from '../types'
import { extensions, wait } from '../utils/functions'
import { useSensitiveContentChecker } from '../utils/useSensitiveContentChecker'
import { CustomDialog } from './CustomDialog'

export default function CreatePasteForm() {
	const {
		showWarning,
		setShowWarning,
		matchedLines,
		checkAndSubmit,
		acceptAndSubmit
	} = useSensitiveContentChecker<PasteForm>()
	const handleCheckAndSubmit = (data: PasteForm) => {
		checkAndSubmit(data, onSubmit)
	}
	const handleRiskAccept = () => {
		acceptAndSubmit(onSubmit)
	}
	const { cmTheme } = useTheme()
	const router = useRouter()
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
		// reset,
		setError,
		setValue,
		control
	} = useForm<PasteForm>({
		defaultValues: {
			title: '',
			slug: '',
			content: '',
			syntax: 'plaintext',
			category: 'none',
			expiration: 'never',
			visibility: 'public',
			folder: 'none',
			passwordEnabled: false,
			password: '',
			pasteAsGuest: false,
			tags: []
		}
	})

	const syntax = watch('syntax')
	const passwordEnabled = watch('passwordEnabled')
	const tags = watch('tags', [])

	const addTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault()
			const value = event.currentTarget.value.trim()
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

	const onSubmit = async (data: PasteForm) => {
		const res = await fetch(
			`${process.env.NEXT_PUBLIC_HONO_API_URL}/api/pastes`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data),
				credentials: 'include'
			}
		)

		const json = await res.json()
		if (res.ok) {
			toast.success('Paste created successfully!')
			// reset()
			await wait(1000)
			if (json.data.expiration !== 'burn_after_read') {
				router.push(`/p/${json.data.slug}`)
			} else {
				toast.success(
					'Your paste has expiration set to "burn after read". It will be deleted after you view it. Redirecting in 5 seconds...',
					{
						duration: 5000
					}
				)
				await wait(5000)
				router.push('/')
			}
		} else {
			toast.error(json.message)

			// map api errors to form errors
			if (json.details && Array.isArray(json.details)) {
				for (const fieldError of json.details) {
					for (const key in fieldError) {
						const message = fieldError[key]
						setError(key as keyof PasteForm, {
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
					<FaFileCode className='w-10 h-10' />
					Create New Paste
				</div>

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
							/>
							{errors.title && (
								<p className='text-error'>
									{errors.title.message}
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
							/>
							{errors.slug && (
								<p className='text-error'>
									{errors.slug.message}
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
								<option value='none'>None</option>
								<option value='cryptocurrency'>
									Cryptocurrency
								</option>
								<option value='cybersecurity'>
									Cybersecurity
								</option>
								<option value='software'>Software</option>
								<option value='fixit'>Fix It</option>
								<option value='gaming'>Gaming</option>
							</select>
						</label>

						<label className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>
									Tags (Coma or Enter separated)
								</span>
							</div>
							<div className='flex flex-wrap gap-2'>
								{tags.map((tag, index) => (
									<div
										key={`${index}:${tag}`}
										className='badge badge-primary flex items-center gap-2'
									>
										{tag}
										<button
											type='button'
											onClick={() => removeTag(tag)}
											className='ml-1 text-white'
										>
											✕
										</button>
									</div>
								))}
							</div>
							<input
								type='text'
								placeholder='Enter tag and press Enter'
								className='input input-bordered w-full mt-2'
								onKeyDown={addTag}
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
								<option value='plaintext'>None</option>
								<option value='javascript'>JavaScript</option>
								<option value='typescript'>TypeScript</option>
								<option value='python'>Python</option>
								<option value='cpp'>C++</option>
								<option value='html'>HTML</option>
								<option value='jsx'>JSX</option>
								<option value='tsx'>TSX</option>
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
							/>
							<span>Password Protect?</span>
						</label>

						{passwordEnabled && (
							<input
								{...register('password')}
								type='password'
								className='input input-bordered w-full'
								placeholder='Password'
							/>
						)}

						<label className='flex items-center gap-2'>
							<input
								type='checkbox'
								className='checkbox'
								{...register('pasteAsGuest')}
							/>
							<span>Paste as guest</span>
						</label>
					</div>
					<div className='divider lg:divider-horizontal' />
					<div className='w-full lg:w-4/5 flex flex-col gap-4 min-w-0'>
						<div className='form-control w-full flex-1 min-w-0'>
							<div className='label'>
								<span className='label-text'>Content</span>
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
											className='rounded-lg border overflow-auto h-[650px]'
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
							Submit
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
