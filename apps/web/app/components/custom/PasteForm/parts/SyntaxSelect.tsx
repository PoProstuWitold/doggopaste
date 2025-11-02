'use client'

import { useFormContext } from 'react-hook-form'
import type { PasteForm as PasteFormType } from '@/app/types'
import { extensions } from '@/app/utils/functions'

export function SyntaxSelect() {
	const { register } = useFormContext<PasteFormType>()
	return (
		<label className='form-control w-full'>
			<div className='label'>
				<span className='label-text'>Syntax</span>
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
	)
}
