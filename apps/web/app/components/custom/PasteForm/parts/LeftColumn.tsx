'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import type { PasteForm as PasteFormType } from '@/app/types'
import { categories } from '@/app/utils/functions'
import { ExpirationSelect } from './ExpirationSelect'
import { FolderSelector } from './FolderSelector'
import { PasswordSection } from './PasswordSection'
import { SyntaxSelect } from './SyntaxSelect'
import { TagsInput } from './TagsInput'
import { VisibilitySelect } from './VisibilitySelect'

export function LeftColumn({
	mode,
	isAuthenticated
}: {
	mode: 'create' | 'edit' | 'fork'
	isAuthenticated: boolean
}) {
	const {
		register,
		setValue,
		watch,
		formState: { errors }
	} = useFormContext<PasteFormType>()
	const visibility = watch('visibility')

	useEffect(() => {
		if (visibility === 'private') {
			setValue('pasteAsGuest', false)
		}
	}, [setValue, visibility])

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
			{(isAuthenticated || mode === 'edit') && (
				<>
					<div className='divider m-0 p-0'>Folders</div>
					<FolderSelector />
				</>
			)}

			{/* Guest toggle */}
			{/* Show only when user is logged and not in edit mode */}
			{isAuthenticated && mode !== 'edit' && (
				<>
					<div className='divider m-0 p-0'>Anonymous</div>
					<label className='flex items-center gap-2 text-sm'>
						<input
							type='checkbox'
							className='checkbox'
							{...register('pasteAsGuest')}
							name='pasteAsGuest'
							disabled={visibility === 'private'}
						/>
						<span>Paste as guest</span>
					</label>
				</>
			)}

			{/* Notify about more options */}
			{!isAuthenticated && mode !== 'edit' && (
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
