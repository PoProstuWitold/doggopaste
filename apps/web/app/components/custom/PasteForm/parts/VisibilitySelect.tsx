'use client'

import { useFormContext } from 'react-hook-form'
import type { PasteForm as PasteFormType } from '@/app/types'

export function VisibilitySelect({
	mode
}: {
	mode: 'create' | 'edit' | 'fork'
}) {
	const { register } = useFormContext<PasteFormType>()
	return (
		<label className='form-control w-full'>
			<div className='label'>
				<span className='label-text'>Visibility</span>
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
					Fork defaults to <b>Unlisted</b> to avoid leaking private
					data.
				</p>
			)}
		</label>
	)
}
