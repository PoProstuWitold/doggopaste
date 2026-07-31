import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FaUserCircle } from 'react-icons/fa'
import { Accounts } from '@/app/components/core/Accounts'
import { Profile } from '@/app/components/core/Profile'
import { Sessions } from '@/app/components/core/Sessions'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'
import {
	getAuthRequestHeaders,
	getCurrentProfileUser,
	getCurrentSession
} from '@/app/utils/session'
import type { AccountDto, SessionDto } from '../types'

export async function generateMetadata(): Promise<Metadata> {
	const currentUser = await getCurrentProfileUser()

	return {
		title: `${currentUser?.name || ''}`,
		description: `Profile of ${currentUser?.name || ''}`,
		metadataBase: new URL(process.env.APP_URL || 'https://doggopaste.org')
	}
}

export default async function ProfilePage() {
	const authClient = createDynamicAuthClient()
	const authHeaders = await getAuthRequestHeaders()
	const [allSessions, accounts, currentSession, currentUser] =
		await Promise.all([
			authClient.listSessions({
				fetchOptions: { headers: authHeaders }
			}),
			authClient.listAccounts({
				fetchOptions: { headers: authHeaders }
			}),
			getCurrentSession(),
			getCurrentProfileUser()
		])

	if (!allSessions.data || !currentSession || !currentUser) {
		await wait(1000)
		redirect('/login')
	}

	const processedSessions: SessionDto[] = allSessions.data.map((session) => ({
		id: session.id,
		token: session.token,
		ipAddress: session.ipAddress ?? null,
		userAgent: session.userAgent ?? null,
		expiresAt: session.expiresAt,
		createdAt: session.createdAt,
		updatedAt: session.updatedAt
	}))
	const processedAccounts: AccountDto[] = (accounts.data ?? []).map(
		(account) => ({
			id: account.id,
			providerId: account.providerId,
			createdAt: account.createdAt,
			updatedAt: account.updatedAt,
			scopes: account.scopes
		})
	)
	const hasCredentialAccount = processedAccounts.some(
		(account) => account.providerId === 'credential'
	)

	return (
		<div className='mx-auto flex w-full max-w-5xl flex-col gap-8 pb-16'>
			<header className='rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-7'>
				<div className='flex items-start gap-4'>
					<span className='flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary'>
						<FaUserCircle className='size-6' aria-hidden='true' />
					</span>
					<div className='min-w-0 space-y-1'>
						<h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>
							Your profile
						</h1>
						<p className='max-w-2xl text-sm leading-relaxed text-base-content/70 sm:text-base'>
							Manage your profile details, connected accounts and
							active sessions.
						</p>
					</div>
				</div>
			</header>

			<div className='flex flex-col gap-4'>
				<Profile
					currentUser={currentUser}
					hasCredentialAccount={hasCredentialAccount}
				/>
				<Accounts
					accounts={processedAccounts}
					hasCredentialAccount={hasCredentialAccount}
				/>
				<Sessions
					allSessions={processedSessions}
					currentSessionToken={currentSession.session.token}
				/>
			</div>
		</div>
	)
}
