'use client'

import { cpp } from '@codemirror/lang-cpp'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import CodeMirror from '@uiw/react-codemirror'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { FaFileCode } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'

interface PasteForm {
	title: string
	content: string
	category: string
	tags: string[]
	syntax: string
	expiration: string
	visibility: string
	folder: string
	passwordEnabled: boolean
	password: string
	pasteAsGuest: boolean
}

const extensions = {
	javascript: javascript(),
	typescript: javascript({ typescript: true }),
	jsx: javascript({ jsx: true }),
	tsx: javascript({ jsx: true, typescript: true }),
	python: python(),
	cpp: cpp(),
	html: html(),
	plaintext: []
}

export default function CreatePasteForm() {
	const { cmTheme } = useTheme()
	const router = useRouter()
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
		reset,
		setValue,
		control
	} = useForm<PasteForm>({
		defaultValues: {
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
		console.log('New paste:', data)
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
		console.log(json)
		if (res.ok) {
			alert('Paste created successfully!')
		} else {
			alert('Failed to create paste')
		}
		reset()
		// router.push('/')
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
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
							<span className='label-text'>
								Paste Name / Title
							</span>
						</div>
						<input
							{...register('title', { required: true })}
							type='text'
							className='input input-bordered w-full'
							placeholder='Paste Title'
						/>
						{errors.title && (
							<p className='text-error'>Title is required</p>
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
							<option value='cybersecurity'>Cybersecurity</option>
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
							<span className='label-text'>Paste Expiration</span>
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
							<span className='label-text'>Paste Visibility</span>
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
										className='rounded-lg border overflow-auto h-[550px]'
										theme={cmTheme}
									/>
								)}
							/>
						</div>
					</div>
					<button type='submit' className='btn btn-primary w-full'>
						Submit
					</button>
				</div>
			</div>
		</form>
	)
}
