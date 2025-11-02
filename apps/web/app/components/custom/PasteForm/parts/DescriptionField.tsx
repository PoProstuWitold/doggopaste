'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import type { PasteForm as PasteFormType } from '@/app/types'

export function DescriptionField() {
	const {
		register,
		formState: { errors }
	} = useFormContext<PasteFormType>()
	const description = useWatch<PasteFormType>({ name: 'description' }) || ''
	const descLen = (description as string).length

	return (
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
					maxLength: { value: 255, message: 'Max 255 characters' }
				})}
				className='textarea textarea-bordered w-full'
				placeholder='Paste Description'
				name='description'
			/>
			{errors.description && (
				<p className='text-error'>
					{errors.description.message || 'Description is required'}
				</p>
			)}
		</label>
	)
}
