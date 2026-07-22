'use client'

import { useFormContext } from 'react-hook-form'
import type { PasteForm as PasteFormValues } from '@/app/types'
import { categories } from '@/app/utils/functions'
import type { PasteFormMode } from '../paste-form-config'

export function BasicOptions({ mode }: { mode: PasteFormMode }) {
	const {
		register,
		formState: { errors }
	} = useFormContext<PasteFormValues>()

	return (
		<>
			<div className='divider m-0 p-0'>Basic options</div>
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
		</>
	)
}
