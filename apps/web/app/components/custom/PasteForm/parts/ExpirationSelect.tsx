'use client'

import { useFormContext } from 'react-hook-form'
import type { PasteForm as PasteFormType } from '@/app/types'

export function ExpirationSelect() {
	const { register } = useFormContext<PasteFormType>()
	return (
		<label className='form-control w-full'>
			<div className='label'>
				<span className='label-text'>Expiration</span>
			</div>
			<select
				{...register('expiration')}
				className='select select-bordered w-full'
			>
				<option value='never'>Never</option>
				<option value='burn_after_read'>Burn after read</option>
				<option value='10m'>10 Minutes</option>
				<option value='1h'>1 Hour</option>
				<option value='1d'>1 Day</option>
				<option value='1w'>1 Week</option>
				<option value='2w'>2 Weeks</option>
			</select>
		</label>
	)
}
