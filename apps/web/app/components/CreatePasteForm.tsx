'use client'

import hljs from 'highlight.js'
import { useRouter } from 'next/navigation'
import { KeyboardEvent, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { FaFileCode } from 'react-icons/fa'

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

export default function CreatePasteForm() {
	const router = useRouter()
	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
		reset,
		setValue
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

	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const preRef = useRef<HTMLPreElement>(null)

	const syntax = watch('syntax')
	const content = watch('content')
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

	const highlightCode = (code: string) => {
		if (preRef.current) {
			const highlighted = hljs.highlight(code, { language: syntax }).value
			preRef.current.innerHTML = `${highlighted}<br/>`
		}
	}

	useEffect(() => {
		highlightCode(content || '')
	}, [syntax, content])

	const handleTabKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Tab') {
			e.preventDefault()
			const textarea = e.currentTarget
			const start = textarea.selectionStart
			const updatedValue = `${textarea.value.substring(0, start)}    ${textarea.value.substring(start)}`
			setValue('content', updatedValue, { shouldValidate: true })
			setTimeout(() => {
				textarea.selectionStart = textarea.selectionEnd = start + 4
			}, 0)
		}
	}

	const syncScroll = () => {
		if (textareaRef.current && preRef.current) {
			preRef.current.scrollTop = textareaRef.current.scrollTop
			preRef.current.scrollLeft = textareaRef.current.scrollLeft
		}
	}

	const onSubmit = async (data: PasteForm) => {
		console.log('New paste:', data)
		const res = await fetch(`${process.env.NEXT_PUBLIC_HONO_API_URL}/api/pastes`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data),
			credentials: 'include'
		})
		console.log(await res.json())
		alert('Paste created successfully! 🥳')
		reset()
		router.push('/')
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
							<span className='label-text'>Tags (Coma or Enter separated)</span>
						</div>
						<div className='flex flex-wrap gap-2'>
							{tags.map((tag, index) => (
								<div key={index} className='badge badge-primary flex items-center gap-2'>
									{tag}
									<button type='button' onClick={() => removeTag(tag)} className='ml-1 text-white'>✕</button>
								</div>
							))}
						</div>
						<input type='text' placeholder='Enter tag and press Enter' className='input input-bordered w-full mt-2' onKeyDown={addTag} />
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
				<div className='divider lg:divider-horizontal'></div>
				<div className='w-full lg:w-4/5 flex flex-col gap-4'>
					<label className='form-control w-full flex-1'>
						<div className='label'>
							<span className='label-text'>Content</span>
						</div>
						<div className='relative h-[500px] w-full font-mono textarea textarea-bordered overflow-hidden'>
							<textarea
								ref={textareaRef}
								onKeyDown={handleTabKey}
								onChange={(e) => {
									setValue('content', e.target.value, {
										shouldValidate: true
									})
									highlightCode(e.target.value)
								}}
								onScroll={syncScroll}
								placeholder='Paste your code here...'
								className='absolute inset-0 z-10 resize-none bg-transparent text-transparent caret-white overflow-auto p-3'
								spellCheck={false}
								value={content}
							/>
							<pre
								ref={preRef}
								aria-hidden='true'
								className={`absolute inset-0 overflow-auto p-3 pointer-events-none language-${syntax}`}
								style={{ whiteSpace: 'pre-wrap' }}
							/>
						</div>
					</label>
					<button type='submit' className='btn btn-primary w-full'>
						Submit
					</button>
				</div>
			</div>
		</form>
	)
}
