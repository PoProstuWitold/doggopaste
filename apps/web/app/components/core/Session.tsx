import { useState } from 'react'
import { UAParser } from 'ua-parser-js'
import type { Session as SessionType } from '../../types'

interface SessionProps {
	session: SessionType
	currentSessionToken: string
	revokeSession: (token: string) => void
}

export const Session: React.FC<SessionProps> = ({
	session,
	currentSessionToken,
	revokeSession
}) => {
	const { browser, os } = UAParser(session.userAgent || '')
	const [showSessionId, setShowSessionId] = useState(false)
	const [showSessionToken, setShowSessionToken] = useState(false)

	return (
		<div className='flex justify-between items-center p-4 border border-error-content rounded-lg shadow-sm'>
			<div className='flex flex-col md:flex-row gap-2 md:items-center w-full justify-between'>
				<div className='flex flex-col gap-2'>
					{currentSessionToken === session.token ? (
						<span className='text-accent font-bold'>
							Current session
						</span>
					) : (
						''
					)}
					<div className='flex md:flex-row md:items-center gap-2 flex-col'>
						<strong>ID:</strong>
						<div className='flex items-center gap-2'>
							<span className='badge badge-neutral'>
								{showSessionId ? session.id : 'HIDDEN'}
							</span>
							<button
								className='btn btn-xs btn-outline rounded-2xl'
								onClick={() => setShowSessionId(!showSessionId)}
								type='button'
							>
								{showSessionId ? 'Hide' : 'Show'}
							</button>
						</div>
					</div>
					<div className='flex md:flex-row md:items-center gap-2 flex-col'>
						<strong>Token:</strong>
						<div className='flex items-center gap-2'>
							<span className='badge badge-neutral'>
								{showSessionToken ? session.token : 'HIDDEN'}
							</span>
							<button
								className='btn btn-xs btn-outline rounded-2xl'
								onClick={() =>
									setShowSessionToken(!showSessionToken)
								}
								type='button'
							>
								{showSessionToken ? 'Hide' : 'Show'}
							</button>
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<strong>IP Address:</strong>
						{session.ipAddress || 'Unknown'}
					</div>
					<div className='flex md:flex-row md:items-center gap-2 flex-col'>
						<strong>User Agent:</strong>
						<span>
							{session.userAgent && os.name
								? `${os.name}, ${browser.name} ${browser.major}`
								: 'Unknown'}
						</span>
					</div>
					<div className='flex md:flex-row md:items-center gap-2 flex-col'>
						<strong>Expires At:</strong>
						{new Date(session.expiresAt).toLocaleString('pl-PL')}
					</div>
					<div className='flex md:flex-row md:items-center gap-2 flex-col'>
						<strong>Created/Updated:</strong>
						{new Date(session.createdAt).toLocaleString('pl-PL')} /
						{new Date(session.updatedAt).toLocaleString('pl-PL')}
					</div>
				</div>
				<button
					type='button'
					className='btn btn-error btn-outline'
					onClick={() => revokeSession(session.token)}
				>
					{session.token === currentSessionToken
						? 'Sign out'
						: 'Revoke'}
				</button>
			</div>
		</div>
	)
}
