'use client'

import { authClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Session as SessionType } from '../types'
import { Session } from './Session'

interface SessionsProps {
	allSessions: SessionType[]
	currentSessionToken: string
}

export const Sessions: React.FC<SessionsProps> = ({
	allSessions,
	currentSessionToken
}) => {
	const router = useRouter()
	const { data: currentSession } = authClient.useSession()

	const revokeSession = async (token: string) => {
		const { data, error } = await authClient.revokeSession({ token })
		console.log(data)
		console.log(error)

		if (data?.status) {
			toast.success('Session revoked')
			await wait(500)
			if (currentSessionToken === token) {
				router.replace('/')
			}
			router.refresh()
		}

		if (error) {
			toast.error('Failed to revoke session')
		}
	}

	const revokeAllSessions = async () => {
		const { data, error } = await authClient.revokeSessions()
		console.log(data)
		console.log(error)

		if (data?.status) {
			toast.success('All sessions revoked')
			await wait(500)
			router.replace('/')
			router.refresh()
		}

		if (error) {
			toast.error('Failed to revoke session')
		}
	}

	const revokeOtherSessions = async () => {
		const { data, error } = await authClient.revokeOtherSessions()
		console.log(data)
		console.log(error)

		if (data?.status) {
			toast.success('Other sessions revoked')
			await wait(500)
			router.refresh()
		}

		if (error) {
			toast.error('Failed to revoke sessions')
		}
	}

	return (
		<>
			<details className='collapse bg-base-200 collapse-arrow'>
				<summary className='collapse-title text-xl font-medium'>
					<div className='flex items-center gap-2'>
						<p>Sessions</p>
						<span className='badge badge-accent'>
							{allSessions?.length
								? `${allSessions.length} active session(s)`
								: null}
						</span>
					</div>
				</summary>
				<div className='collapse-content flex flex-col gap-2 p-2'>
					<div className='p-2 flex flex-col gap-4'>
						{allSessions.map((session) => (
							<Session
								key={session.id}
								currentSessionToken={currentSessionToken}
								session={session}
								revokeSession={revokeSession}
							/>
						))}
					</div>
					<div className='p-2'>
						<div className='p-4 border border-error rounded-lg shadow-lg flex flex-col gap-4'>
							<h2 className='text-xl font-bold text-error'>
								Danger Zone
							</h2>
							<p className='text-error'>
								Be careful! These actions cannot be undone and
								will affect your active sessions.
							</p>
							<div className='flex flex-col md:flex-row gap-4'>
								<button
									type='button'
									className='btn btn-error'
									onClick={revokeAllSessions}
								>
									Revoke all sessions
								</button>
								<button
									type='button'
									className='btn btn-error'
									onClick={revokeOtherSessions}
								>
									Revoke other sessions
								</button>
								{currentSession?.session ? (
									<button
										type='button'
										className='btn btn-error'
										onClick={() =>
											revokeSession(
												currentSession?.session.token
											)
										}
									>
										Revoke current session
									</button>
								) : null}
							</div>
						</div>
					</div>
				</div>
			</details>
		</>
	)
}
