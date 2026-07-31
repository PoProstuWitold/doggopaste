'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'
import type { SessionDto } from '../../types'
import { Session } from './Session'

interface SessionsProps {
	allSessions: SessionDto[]
	currentSessionToken: string
}

export const Sessions: React.FC<SessionsProps> = ({
	allSessions,
	currentSessionToken
}) => {
	const authClient = createDynamicAuthClient()
	const router = useRouter()
	const currentSession = allSessions.find(
		(session) => session.token === currentSessionToken
	)

	const revokeSession = async (token: string) => {
		const { data, error } = await authClient.revokeSession({ token })

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
		<section aria-labelledby='active-sessions-heading'>
			<h2 id='active-sessions-heading' className='sr-only'>
				Sessions
			</h2>
			<details className='collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100'>
				<summary className='collapse-title min-h-0 p-4 pr-12 sm:p-5 sm:pr-12'>
					<span className='flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
						<span className='flex min-w-0 items-center gap-3'>
							<span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info'>
								<FaShieldAlt aria-hidden='true' />
							</span>
							<span className='min-w-0'>
								<span className='block text-lg font-semibold'>
									Sessions
								</span>
								<span className='block text-sm font-normal text-base-content/65'>
									Review where your account is signed in
								</span>
							</span>
						</span>
						<span className='badge badge-accent h-auto max-w-full gap-1.5 py-1'>
							<FaShieldAlt
								className='size-3'
								aria-hidden='true'
							/>
							{`${allSessions.length} active session(s)`}
						</span>
					</span>
				</summary>
				<div className='collapse-content flex flex-col gap-5 px-4 pb-4 sm:px-5 sm:pb-5'>
					<div className='flex flex-col gap-4'>
						{allSessions.map((session) => (
							<Session
								key={session.id}
								currentSessionToken={currentSessionToken}
								session={session}
								revokeSession={revokeSession}
							/>
						))}
					</div>
					<div className='flex flex-col gap-4 rounded-xl border border-error/50 bg-error/5 p-4 sm:p-5'>
						<div className='flex items-start gap-3'>
							<FaExclamationTriangle
								className='mt-1 shrink-0 text-error'
								aria-hidden='true'
							/>
							<div className='min-w-0'>
								<h3 className='text-lg font-bold text-error'>
									Danger Zone
								</h3>
								<p className='mt-1 text-sm leading-relaxed text-base-content/75'>
									Be careful! These actions cannot be undone
									and will affect your active sessions.
								</p>
							</div>
						</div>
						<div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
							<button
								type='button'
								className='btn btn-error w-full'
								onClick={revokeAllSessions}
							>
								Revoke all sessions
							</button>
							<button
								type='button'
								className='btn btn-error btn-outline w-full'
								onClick={revokeOtherSessions}
							>
								Revoke other sessions
							</button>
							{currentSession ? (
								<button
									type='button'
									className='btn btn-error btn-outline w-full'
									onClick={() =>
										revokeSession(currentSession.token)
									}
								>
									Revoke current session
								</button>
							) : null}
						</div>
					</div>
				</div>
			</details>
		</section>
	)
}
