import { Accounts } from '@/app/components/Accounts'
import { Profile, type ProfileProps } from '@/app/components/Profile'
import { Sessions } from '@/app/components/Sessions'
import { authClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import toast from 'react-hot-toast'

interface Session {
	id: string
	expiresAt: Date
	token: string
	createdAt: Date
	updatedAt: Date
	ipAddress?: string | null
	userAgent?: string | null
}

export default async function ProfilePage() {
	const allSessions = await authClient.listSessions({
		fetchOptions: {
			headers: await headers()
		}
	})

	if (!allSessions.data) {
		toast.error('Failed to fetch sessions')
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
		toast.error('Failed to fetch current session')
		await wait(1000)
		redirect('/login')
	}

	const accounts = await authClient.listAccounts({
		fetchOptions: {
			headers: await headers()
		}
	})

	return (
		<>
			<div className='flex flex-col gap-4'>
				<Profile
					currentSession={
						currentSession.data as ProfileProps['currentSession']
					}
				/>
				<Accounts accounts={accounts.data} />
				<Sessions
					allSessions={processedSessions}
					currentSessionToken={currentSession.data.session.token}
				/>
			</div>
		</>
	)
}
