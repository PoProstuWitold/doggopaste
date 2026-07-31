'use client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FaLink } from 'react-icons/fa'
import { FaFacebook, FaGithub, FaGoogle } from 'react-icons/fa6'
import { RiLockPasswordFill } from 'react-icons/ri'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'
import type { AccountDto } from '../../types'
import { Account } from './Account'

interface AccountsProps {
	accounts: AccountDto[]
	hasCredentialAccount: boolean
}

const providerLabels = {
	google: 'Google',
	github: 'GitHub',
	facebook: 'Facebook'
} as const

export const Accounts: React.FC<AccountsProps> = ({
	accounts,
	hasCredentialAccount
}) => {
	const authClient = createDynamicAuthClient()
	const router = useRouter()
	const providers: ('google' | 'github' | 'facebook')[] = [
		'google',
		'github',
		'facebook'
	]

	const linkSocial = async (provider: 'google' | 'github' | 'facebook') => {
		const { data, error } = await authClient.linkSocial({
			provider,
			callbackURL: '/api/redirect'
		})

		if (data) {
			toast.success(`Linked ${provider} account`)
			await wait(500)
			router.refresh()
		}

		if (error) {
			toast.error(error.message || 'Failed to link account')
		}
	}

	const createPassword = async () => {
		alert('NOT IMPLEMENTED YET')
	}

	const unlinkSocial = async (
		providerId: 'google' | 'github' | 'facebook'
	) => {
		const { data, error } = await authClient.unlinkAccount({
			providerId
		})

		if (data) {
			toast.success(`Unlinked ${providerId} account`)
			await wait(500)
			router.refresh()
		}

		if (error) {
			toast.error('Failed to unlink account')
		}
	}

	// Determine which providers are not yet linked
	const linkedProviders = accounts?.map((account) => account.providerId) || []
	const unlinkedProviders = providers.filter(
		(provider) => !linkedProviders.includes(provider)
	)

	return (
		<section aria-labelledby='connected-accounts-heading'>
			<h2 id='connected-accounts-heading' className='sr-only'>
				Accounts
			</h2>
			<details className='collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100'>
				<summary className='collapse-title min-h-0 p-4 pr-12 sm:p-5 sm:pr-12'>
					<span className='flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
						<span className='flex min-w-0 items-center gap-3'>
							<span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary'>
								<FaLink aria-hidden='true' />
							</span>
							<span className='min-w-0'>
								<span className='block text-lg font-semibold'>
									Accounts
								</span>
								<span className='block text-sm font-normal text-base-content/65'>
									Manage your sign-in methods
								</span>
							</span>
						</span>
						<span className='badge badge-accent h-auto max-w-full gap-1.5 py-1'>
							<FaLink className='size-3' aria-hidden='true' />
							{`${accounts.length} connected account(s)`}
						</span>
					</span>
				</summary>
				<div className='collapse-content px-4 pb-4 sm:px-5 sm:pb-5'>
					<div className='flex flex-col gap-4'>
						{/* Credential account */}
						{!hasCredentialAccount ? (
							<div className='flex flex-col gap-4 rounded-xl border border-base-300 bg-base-200/35 p-4 sm:flex-row sm:items-center sm:justify-between'>
								<div className='flex min-w-0 items-center gap-3'>
									<span className='flex size-10 shrink-0 items-center justify-center rounded-lg bg-base-300'>
										<RiLockPasswordFill aria-hidden='true' />
									</span>
									<div className='min-w-0'>
										<p className='font-semibold'>
											Credential
										</p>
										<p className='text-sm text-base-content/65'>
											Sign in with a password
										</p>
									</div>
								</div>
								<button
									onClick={() => createPassword()}
									type='button'
									className='btn btn-primary w-full sm:w-auto'
								>
									Create password
								</button>
							</div>
						) : null}

						{/* Unlinked providers (show link buttons) */}
						{unlinkedProviders.map((provider) => (
							<div
								key={provider}
								className='flex flex-col gap-4 rounded-xl border border-base-300 bg-base-200/35 p-4 sm:flex-row sm:items-center sm:justify-between'
							>
								<div className='flex min-w-0 items-center gap-3'>
									{provider === 'github' ? (
										<FaGithub
											className='size-6 shrink-0'
											aria-hidden='true'
										/>
									) : null}
									{provider === 'google' ? (
										<FaGoogle
											className='size-6 shrink-0'
											aria-hidden='true'
										/>
									) : null}
									{provider === 'facebook' ? (
										<FaFacebook
											className='size-6 shrink-0'
											aria-hidden='true'
										/>
									) : null}
									<div className='min-w-0'>
										<p className='font-semibold'>
											{providerLabels[provider]}
										</p>
										<p className='text-sm text-base-content/65'>
											Not connected
										</p>
									</div>
								</div>
								<button
									onClick={() => linkSocial(provider)}
									type='button'
									className='btn btn-primary w-full sm:w-auto'
								>
									Link Account
								</button>
							</div>
						))}

						{/* Linked providers (show unlink buttons) */}
						{accounts?.map((account) => (
							<Account
								key={account.id}
								account={account}
								unlinkSocial={unlinkSocial}
							/>
						))}
					</div>
				</div>
			</details>
		</section>
	)
}
