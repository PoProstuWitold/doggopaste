import { useState } from 'react'
import { FaFingerprint } from 'react-icons/fa'
import { FaFacebook, FaGithub, FaGoogle } from 'react-icons/fa6'
import { RiLockPasswordFill } from 'react-icons/ri'
import type { AccountDto } from '../../types'

interface AccountProps {
	account: AccountDto
	unlinkSocial: (provider: 'google' | 'github' | 'facebook') => void
}

const providerLabels: Record<string, string> = {
	github: 'GitHub',
	google: 'Google',
	facebook: 'Facebook',
	credential: 'Credential'
}

export const Account: React.FC<AccountProps> = ({ account, unlinkSocial }) => {
	const [showAccountId, setShowAccountId] = useState(false)
	const providerLabel =
		providerLabels[account.providerId] ?? account.providerId

	return (
		<article className='flex w-full min-w-0 flex-col gap-4 rounded-xl border border-base-300 bg-base-100 p-4 sm:flex-row sm:items-center sm:justify-between'>
			<div className='min-w-0 space-y-3'>
				<div className='flex min-w-0 items-center gap-3'>
					{account.providerId === 'github' ? (
						<FaGithub
							className='size-6 shrink-0'
							aria-hidden='true'
						/>
					) : null}
					{account.providerId === 'google' ? (
						<FaGoogle
							className='size-6 shrink-0'
							aria-hidden='true'
						/>
					) : null}
					{account.providerId === 'facebook' ? (
						<FaFacebook
							className='size-6 shrink-0'
							aria-hidden='true'
						/>
					) : null}
					{account.providerId === 'credential' ? (
						<RiLockPasswordFill
							className='size-6 shrink-0'
							aria-hidden='true'
						/>
					) : null}
					<h3 className='truncate text-lg font-semibold'>
						{providerLabel}
					</h3>
					<span className='badge badge-success badge-outline h-auto py-1'>
						Connected
					</span>
				</div>
				<div className='flex min-w-0 flex-col gap-2'>
					<span className='flex items-center gap-2 text-sm font-semibold text-base-content/70'>
						<FaFingerprint aria-hidden='true' /> Account ID
					</span>
					<div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center'>
						<code className='min-w-0 break-all rounded-lg bg-base-200 px-3 py-2 text-xs'>
							{showAccountId ? account.id : 'HIDDEN'}
						</code>
						<button
							className='btn btn-sm btn-outline min-h-11 w-full shrink-0 rounded-xl sm:w-auto'
							onClick={() => setShowAccountId(!showAccountId)}
							type='button'
							aria-pressed={showAccountId}
							aria-label={
								showAccountId
									? 'Hide account ID'
									: 'Show account ID'
							}
						>
							{showAccountId ? 'Hide' : 'Show'}
						</button>
					</div>
				</div>
				<div className='min-w-0 text-sm'>
					<span className='font-semibold text-base-content/70'>
						Scopes:{' '}
					</span>
					<span className='break-all'>
						{account.scopes.length
							? account.scopes.join(', ')
							: 'No scopes'}
					</span>
				</div>
				<div className='grid min-w-0 gap-1 text-sm text-base-content/75 sm:grid-cols-2 sm:gap-4'>
					<span>
						Created:{' '}
						{new Date(account.createdAt).toLocaleString('pl-PL')}
					</span>
					<span>
						Updated:{' '}
						{new Date(account.updatedAt).toLocaleString('pl-PL')}
					</span>
				</div>
			</div>
			{/* Unlink Button */}
			{account.providerId !== 'credential' ? (
				<button
					onClick={() =>
						unlinkSocial(
							account.providerId as
								| 'google'
								| 'github'
								| 'facebook'
						)
					}
					type='button'
					className='btn btn-error btn-outline w-full shrink-0 sm:w-auto'
				>
					Unlink
				</button>
			) : null}
		</article>
	)
}
