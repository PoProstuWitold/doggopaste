'use client'
import { authClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface AccountsProps {
	accounts:
		| {
				id: string
				provider: string
				createdAt: Date
				updatedAt: Date
				accountId: string
				scopes: string[]
		  }[]
		| null
}

export const Accounts: React.FC<AccountsProps> = ({ accounts }) => {
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
		console.log(data)
		console.log(error)

		if (data) {
			toast.success(`Linked ${provider} account`)
			await wait(500)
			router.refresh()
		}

		if (error) {
			toast.error(error.message || 'Failed to link account')
		}
	}

	const unlinkSocial = async (
		providerId: 'google' | 'github' | 'facebook'
	) => {
		const { data, error } = await authClient.unlinkAccount({
			providerId
		})
		console.log(data)
		console.log(error)

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
					Accounts
				</summary>
				<div className='collapse-content'>
					<div className='flex flex-col gap-4'>
						{/* Unlinked providers (show link buttons) */}
						{unlinkedProviders.map((provider) => (
							<div
								key={provider}
								className='flex justify-between items-center p-4'
							>
								<div>
									<strong>
										{provider.charAt(0).toUpperCase() +
											provider.slice(1)}
									</strong>
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
							<div
								key={`${account.id}:${account.accountId}`}
								className='flex flex-col gap-2 border p-4 border-error-content rounded-lg shadow-sm'
							>
								<div>
									<strong>Provider:</strong>{' '}
									{account.provider}
								</div>
								<div>
									<strong>Created At:</strong>{' '}
									{new Date(account.createdAt).toString()}
								</div>
								<div>
									<strong>Updated At:</strong>{' '}
									{new Date(account.updatedAt).toString()}
								</div>
								<div>
									<strong>Account ID:</strong>{' '}
									{account.accountId}
								</div>
								<div>
									<strong>Scopes:</strong>{' '}
									{account.scopes.length
										? account.scopes.join(', ')
										: 'No scopes'}
								</div>
								{/* Unlink Button */}
								{account.provider !== 'credential' ? (
									<>
										<div>
											<button
												onClick={() =>
													unlinkSocial(
														account.provider as
															| 'google'
															| 'github'
															| 'facebook'
													)
												}
												type='button'
												className='btn btn-error'
											>
												Unlink
											</button>
										</div>
									</>
								) : null}
							</div>
						))}
					</div>
				</div>
			</details>
		</>
	)
}
