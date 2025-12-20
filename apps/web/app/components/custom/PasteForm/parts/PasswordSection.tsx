'use client'

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { FaInfoCircle } from 'react-icons/fa'
import { FaShieldHalved } from 'react-icons/fa6'
import { CustomDialog } from '@/app/components/core/CustomDialog'
import type { PasteForm } from '@/app/types'

export function PasswordSection() {
	const {
		register,
		watch,
		setValue,
		formState: { errors }
	} = useFormContext<PasteForm>()

	const passwordEnabled = watch('passwordEnabled')

	useEffect(() => {
		if (!passwordEnabled) {
			setValue('encrypted', false)
		}
	}, [passwordEnabled, setValue])

	return (
		<div className='flex flex-col gap-2'>
			<label className='flex items-center gap-2 text-sm cursor-pointer w-fit'>
				<input
					type='checkbox'
					className='checkbox'
					{...register('passwordEnabled')}
				/>
				<span>Password protection?</span>
			</label>

			{passwordEnabled && (
				<div className='flex items-center gap-2'>
					<label className='flex items-center gap-2 text-sm cursor-pointer w-fit'>
						<input
							type='checkbox'
							className='checkbox'
							{...register('encrypted')}
						/>
						<span>Client-side encryption</span>
					</label>

					<CustomDialog
						title='Client-side encryption'
						description='Important Security Information'
						btnContent={<FaInfoCircle className='w-4 h-4' />}
						btnClasses='btn btn-ghost btn-xs btn-circle text-info'
					>
						<div className='text-sm text-base-content/80 flex flex-col gap-3'>
							<p>
								By enabling this option, your paste content will
								be encrypted
								<b> exclusively in your browser</b> before being
								sent to the server.
							</p>

							<div className='alert alert-warning p-2 text-xs grid-cols-[auto_1fr]'>
								<FaShieldHalved />
								<span>
									<b>Warning:</b> The password used for
									encryption (or even its hash) is{' '}
									<b>NEVER</b> sent to the server.
								</span>
							</div>

							<ul className='list-disc list-inside space-y-1 mt-1'>
								<li>
									The server only receives a random string of
									characters.
								</li>
								<li>
									Administrators cannot read your content.
								</li>
								<li className='font-bold text-error'>
									If you lose your password, it will be
									impossible to recover the content.
								</li>
							</ul>

							<p className='text-xs opacity-70 mt-2 border-t border-base-content/10 pt-2'>
								<b>
									<i>Difference:</i>
								</b>{' '}
								Standard "Password protection" sends a password
								hash to the server to verify access, but the
								content is technically readable by the database
								admin. Client-side encryption Encryption ensures
								total privacy.
							</p>
						</div>
					</CustomDialog>
				</div>
			)}

			{passwordEnabled && (
				<div className='flex flex-col gap-1'>
					<input
						{...register('password', {
							required:
								'Password is required for protection/encryption',
							minLength: {
								value: 1,
								message: 'Password cannot be empty'
							}
						})}
						type='password'
						className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
						placeholder='Enter password...'
						autoComplete='new-password'
					/>
					{errors.password && (
						<span className='text-error pl-1'>
							{errors.password.message}
						</span>
					)}
				</div>
			)}
		</div>
	)
}
