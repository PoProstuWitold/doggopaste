import { useState } from 'react'
import { FaFacebook, FaGithub, FaGoogle } from 'react-icons/fa6'
import { RiLockPasswordFill } from 'react-icons/ri'
import type { Account as AccountType } from '../types'

interface AccountProps {
	account: AccountType
	unlinkSocial: (provider: 'google' | 'github' | 'facebook') => void
}

export const Account: React.FC<AccountProps> = ({ account, unlinkSocial }) => {
	const [showAccountId, setShowAccountId] = useState(false)

	return (
		<div
			key={`${account.id}:${account.accountId}`}
			className='flex md:flex-row gap-2 border p-4 border-error-content rounded-lg shadow-sm md:items-center w-full justify-between flex-col'
		>
			<div>
				<div className='flex items-center gap-2'>
					{account.provider === 'github' ? (
						<div className='flex items-center gap-2 text-xl font-bold'>
							<FaGithub />
							<span>GitHub</span>
						</div>
					) : null}
					{account.provider === 'google' ? (
						<div className='flex items-center gap-2 text-xl font-bold'>
							<FaGoogle />
							<span>Google</span>
						</div>
					) : null}
					{account.provider === 'facebook' ? (
						<div className='flex items-center gap-2 text-xl font-bold'>
							<FaFacebook />
							<span>Facebook</span>
						</div>
					) : null}
					{account.provider === 'credential' ? (
						<div className='flex items-center gap-2 text-xl font-bold'>
							<RiLockPasswordFill />
							<span>Credential</span>
						</div>
					) : null}
				</div>
				<div className='flex md:flex-row md:items-center gap-2 flex-col'>
					<strong>ID:</strong>
					<div className='flex items-center gap-2'>
						<span className='badge badge-neutral'>
							{showAccountId ? account.id : 'HIDDEN'}
						</span>
						<button
							className='btn btn-xs btn-outline rounded-2xl'
							onClick={() => setShowAccountId(!showAccountId)}
							type='button'
						>
							{showAccountId ? 'Hide' : 'Show'}
						</button>
					</div>
				</div>
				<div className='flex items-center gap-2'>
					<strong>Scopes:</strong>
					{account.scopes.length
						? account.scopes.join(', ')
						: 'No scopes'}
				</div>
				<div className='flex md:flex-row md:items-center gap-2 flex-col'>
					<strong>Created/Updated:</strong>
					{new Date(account.createdAt).toLocaleString('pl-PL')}/
					{new Date(account.updatedAt).toLocaleString('pl-PL')}
				</div>
			</div>
			{/* Unlink Button */}
			{account.provider !== 'credential' ? (
				<button
					onClick={() =>
						unlinkSocial(
							account.provider as 'google' | 'github' | 'facebook'
						)
					}
					type='button'
					className='btn btn-error btn-outline'
				>
					Unlink
				</button>
			) : null}
		</div>
	)
}
