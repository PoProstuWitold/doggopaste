'use client'

import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import type { PasteForm as PasteFormType, User } from '@/app/types'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { categories } from '@/app/utils/functions'
import { ExpirationSelect } from './ExpirationSelect'
import { FolderSelector } from './FolderSelector'
import { PasswordSection } from './PasswordSection'
import { SyntaxSelect } from './SyntaxSelect'
import { TagsInput } from './TagsInput'
import { VisibilitySelect } from './VisibilitySelect'

export function LeftColumn({ mode }: { mode: 'create' | 'edit' | 'fork' }) {
	const {
		register,
		formState: { errors }
	} = useFormContext<PasteFormType>()
	const [user, setUser] = useState<User | null>(null)

	useEffect(() => {
		let ignore = false

		async function fetchUser() {
			const authClient = createDynamicAuthClient()
			const { data, error } = await authClient.getSession()

			if (error) {
				console.error('getSession error:', error)
				if (!ignore) setUser(null)
				return
			}

			const nextUser = data?.user ?? null
			if (!ignore) setUser(nextUser)
		}
		fetchUser()

		return () => {
			ignore = true
		}
	}, [])

	return (
		<div className='w-full lg:w-1/5 flex flex-col gap-4'>
			<div className='divider m-0 p-0'>Basic options</div>
			{/* Title */}
			<label className='form-control w-full'>
				<div className='label'>
					<span className='label-text'>Title</span>
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
						{errors.title.message || 'Title is required'}
					</p>
				)}
			</label>

			{/* Slug */}
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
					<p className='text-error'>{errors.slug.message}</p>
				)}
				{mode === 'fork' && (
					<p className='text-xs text-base-content/60'>
						Leaving slug empty will auto-generate a new one for the
						fork.
					</p>
				)}
			</label>

			{/* Category */}
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

			{/* Tags */}
			<TagsInput />

			{/* Syntax */}
			<SyntaxSelect />

			{/* Expiration */}
			<ExpirationSelect />

			{/* Visibility */}
			<VisibilitySelect mode={mode} />

			{/* Password toggle */}
			<div className='divider m-0 p-0'>Password</div>
			<PasswordSection />

			{/* Folder + inline create */}
			{(user || mode === 'edit') && (
				<>
					<div className='divider m-0 p-0'>Folders</div>
					<FolderSelector />
				</>
			)}

			{/* Guest toggle */}
			{/* Show only when user is logged and not in edit mode */}
			{user && mode !== 'edit' && (
				<>
					<div className='divider m-0 p-0'>Anonymous</div>
					<label className='flex items-center gap-2 text-sm'>
						<input
							type='checkbox'
							className='checkbox'
							{...register('pasteAsGuest')}
							name='pasteAsGuest'
						/>
						<span>Paste as guest</span>
					</label>
				</>
			)}

			{/* Notify about more options */}
			{!user && mode !== 'edit' && (
				<>
					<div className='divider' />
					<p className='text-sm text-base-content/60'>
						Sign in to access more options like folders and managing
						your pastes.
					</p>
				</>
			)}
		</div>
	)
}
