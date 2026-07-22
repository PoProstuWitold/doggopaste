'use client'

import type { FormEventHandler } from 'react'
import { FaUnlock } from 'react-icons/fa'
import { CustomDialog } from '@/app/components/core/CustomDialog'
import type { PasteFormMode } from '../paste-form-config'

export function UnlockDialog({
	hasServerLock,
	isLocked,
	isUnlocking,
	mode,
	onCancel,
	onPasswordChange,
	onSubmit,
	unlockPassword
}: {
	hasServerLock: boolean
	isLocked: boolean
	isUnlocking: boolean
	mode: PasteFormMode
	onCancel: () => void
	onPasswordChange: (password: string) => void
	onSubmit: FormEventHandler<HTMLFormElement>
	unlockPassword: string
}) {
	return (
		<CustomDialog
			isOpen={isLocked}
			onClose={onCancel}
			title={mode === 'edit' ? 'Unlock to Edit' : 'Unlock to Fork'}
			description={
				hasServerLock
					? 'This paste is protected by a server-side password. Please enter it to continue.'
					: 'This paste is encrypted client-side. Please enter the decryption password.'
			}
			btnClasses='hidden'
		>
			<form onSubmit={onSubmit} className='flex flex-col gap-4'>
				<div className='form-control w-full'>
					<label
						className='label'
						htmlFor='paste-form-unlock-password'
					>
						<span className='label-text font-bold'>Password</span>
					</label>
					<input
						id='paste-form-unlock-password'
						type='password'
						autoComplete='current-password'
						className='input input-bordered w-full'
						placeholder='Enter password...'
						value={unlockPassword}
						onChange={(event) =>
							onPasswordChange(event.target.value)
						}
					/>
				</div>
				<div className='flex justify-between items-center mt-2'>
					<button
						type='button'
						className='btn btn-ghost'
						onClick={onCancel}
					>
						Go Back
					</button>
					<button
						type='submit'
						className='btn btn-primary'
						disabled={!unlockPassword || isUnlocking}
					>
						{isUnlocking ? (
							<span className='loading loading-spinner'></span>
						) : (
							<>
								Unlock <FaUnlock />
							</>
						)}
					</button>
				</div>
			</form>
		</CustomDialog>
	)
}
