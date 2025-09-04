import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Accounts } from '@/app/components/core/Accounts'
import { Profile } from '@/app/components/core/Profile'
import { Sessions } from '@/app/components/core/Sessions'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'
import type { Session } from '../types'

export async function generateMetadata(): Promise<Metadata> {
	const authClient = createDynamicAuthClient()
	const currentSession = await authClient.getSession({
		fetchOptions: {
			headers: await headers()
		}
	})

	return {
		title: `${currentSession.data?.user.name || ''}`,
		description: `Profile of ${currentSession.data?.user.name || ''}`,
		metadataBase: new URL(process.env.APP_URL || 'https://doggopaste.org')
	}
}

export default async function ProfilePage() {
	const authClient = createDynamicAuthClient()
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
		accounts.data?.some((account) => account.providerId === 'credential') ??
		false

	return (
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
	)
}
