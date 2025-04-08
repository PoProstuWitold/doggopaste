import { Accounts } from '@/app/components/Accounts'
import { Profile } from '@/app/components/Profile'
import { Sessions } from '@/app/components/Sessions'
import { authClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Session } from '../types'

export async function generateMetadata(): Promise<Metadata> {
	const currentSession = await authClient.getSession({
		fetchOptions: {
			headers: await headers()
		}
	})

	return {
		title: `${currentSession.data?.user.name || ''}`,
		description: `Profile of ${currentSession.data?.user.name || ''}`,
		metadataBase: new URL(
			process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
		)
	}
}

export default async function ProfilePage() {
	const allSessions = await authClient.listSessions({
		fetchOptions: {
			headers: await headers()
		}
	})

	if (!allSessions.data) {
		await wait(1000)
		redirect('/login')
	}

	const processedSessions = allSessions.data.map((session: Session) => ({
		...session,
		ipAddress: session.ipAddress || 'Unknown',
		userAgent: session.userAgent || 'Unknown'
	}))

	const currentSession = await authClient.getSession({
		fetchOptions: {
			headers: await headers()
		}
	})

	if (!currentSession.data || !allSessions) {
		await wait(1000)
		redirect('/login')
	}

	const accounts = await authClient.listAccounts({
		fetchOptions: {
			headers: await headers()
		}
	})
	const hasCredentialAccount =
		accounts.data?.some((account) => account.provider === 'credential') ??
		false

	return (
		<>
			<div className='flex flex-col gap-4'>
				<Profile
					currentSession={currentSession.data}
					hasCredentialAccount={hasCredentialAccount}
				/>
				<Accounts
					accounts={accounts.data}
					hasCredentialAccount={hasCredentialAccount}
				/>
				<Sessions
					allSessions={processedSessions}
					currentSessionToken={currentSession.data.session.token}
				/>
			</div>
		</>
	)
}
