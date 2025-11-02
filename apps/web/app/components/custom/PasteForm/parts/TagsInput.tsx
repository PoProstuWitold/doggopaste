'use client'

import { useFormContext } from 'react-hook-form'
import toast from 'react-hot-toast'
import { IoIosClose } from 'react-icons/io'
import type { PasteForm as PasteFormType } from '@/app/types'

export function TagsInput() {
	const { setValue, watch } = useFormContext<PasteFormType>()
	const tags = watch('tags', [])

	const removeTag = (tag: string) => {
		const updated = tags.filter((t: string) => t !== tag)
		setValue('tags', updated, { shouldValidate: true })
	}

	const addTag: React.KeyboardEventHandler<HTMLInputElement> = (
		event
	): void => {
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

	return (
		<label className='form-control w-full'>
			<div className='label'>
				<span className='label-text mb-1'>
					Tags&nbsp;
					<span>
						(separated by <kbd className='kbd kbd-sm'>,</kbd> or{' '}
						<kbd className='kbd kbd-sm'>Enter</kbd>)
					</span>
				</span>
			</div>
			<div className='flex flex-wrap gap-2'>
				{tags.map((tag: string, index: number) => (
					<span
						key={`${index}:${tag}`}
						className='badge badge-accent flex items-center'
					>
						<span>#{tag}</span>
						{/* button breaks functionality for some reason */}
						{/* biome-ignore lint: has to be span, no button */}
						<span
							className='cursor-pointer text-error'
							onClick={(e) => {
								e.stopPropagation()
								removeTag(tag)
							}}
							onKeyDown={() => {}}
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
	)
}
