'use client'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FaFacebook, FaGithub, FaGoogle } from 'react-icons/fa6'
import { RiLockPasswordFill } from 'react-icons/ri'
import type { Account as AccountType } from '../types'
import { Account } from './Account'

interface AccountsProps {
	accounts: AccountType[] | null
	hasCredentialAccount: boolean
}

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
		console.info(data)
		console.info(error)

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
		console.info(data)
		console.info(error)

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
	const linkedProviders = accounts?.map((account) => account.provider) || []
	const unlinkedProviders = providers.filter(
		(provider) => !linkedProviders.includes(provider)
	)

	return (
		<>
			<details className='collapse bg-base-200 collapse-arrow'>
				<summary className='collapse-title text-xl font-medium'>
					<div className='flex items-center gap-2'>
						<p>Accounts</p>
						<span className='badge badge-accent'>
							{accounts?.length
								? `${accounts.length} connected account(s)`
								: null}
						</span>
					</div>
				</summary>
				<div className='collapse-content'>
					<div className='flex flex-col gap-4'>
						{/* Credential account */}
						{!hasCredentialAccount ? (
							<div className='flex justify-between items-center p-4'>
								<div className='flex items-center gap-2'>
									<div className='flex items-center gap-2 text-xl font-bold'>
										<RiLockPasswordFill />
										<span>Credential</span>
									</div>
								</div>
								<button
									onClick={() => createPassword()}
									type='button'
									className='btn btn-primary'
								>
									Create password
								</button>
							</div>
						) : null}

						{/* Unlinked providers (show link buttons) */}
						{unlinkedProviders.map((provider) => (
							<div
								key={provider}
								className='flex justify-between items-center p-4'
							>
								<div className='flex items-center gap-2'>
									{provider === 'github' ? (
										<div className='flex items-center gap-2 text-xl font-bold'>
											<FaGithub />
											<span>GitHub</span>
										</div>
									) : null}
									{provider === 'google' ? (
										<div className='flex items-center gap-2 text-xl font-bold'>
											<FaGoogle />
											<span>Google</span>
										</div>
									) : null}
									{provider === 'facebook' ? (
										<div className='flex items-center gap-2 text-xl font-bold'>
											<FaFacebook />
											<span>Facebook</span>
										</div>
									) : null}
								</div>
								<button
									onClick={() => linkSocial(provider)}
									type='button'
									className='btn btn-primary'
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
		</>
	)
}
