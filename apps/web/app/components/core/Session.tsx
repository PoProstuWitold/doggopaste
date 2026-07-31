import { useState } from 'react'
import {
	FaCalendarAlt,
	FaCheckCircle,
	FaClock,
	FaDesktop,
	FaFingerprint,
	FaKey,
	FaNetworkWired
} from 'react-icons/fa'
import { UAParser } from 'ua-parser-js'
import type { SessionDto } from '../../types'

interface SessionProps {
	session: SessionDto
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
		<article
			className='rounded-xl border border-base-300 bg-base-100 p-4'
			aria-label={
				currentSessionToken === session.token
					? 'Current session'
					: 'Other active session'
			}
		>
			<div className='flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between'>
				<div className='flex min-w-0 flex-1 flex-col gap-3'>
					{currentSessionToken === session.token ? (
						<span className='badge badge-success badge-outline h-auto w-fit gap-1.5 py-1'>
							<FaCheckCircle aria-hidden='true' /> Current session
						</span>
					) : (
						''
					)}
					<div className='grid min-w-0 gap-3 xl:grid-cols-2'>
						<div className='min-w-0 rounded-lg bg-base-200/50 p-3'>
							<p className='mb-2 flex items-center gap-2 text-sm font-semibold text-base-content/70'>
								<FaFingerprint aria-hidden='true' /> Session ID
							</p>
							<div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center'>
								<code className='min-w-0 break-all rounded-lg bg-base-300 px-3 py-2 text-xs'>
									{showSessionId ? session.id : 'HIDDEN'}
								</code>
								<button
									className='btn btn-sm btn-outline min-h-11 w-full shrink-0 rounded-xl sm:w-auto'
									onClick={() =>
										setShowSessionId(!showSessionId)
									}
									type='button'
									aria-pressed={showSessionId}
									aria-label={
										showSessionId
											? 'Hide session ID'
											: 'Show session ID'
									}
								>
									{showSessionId ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>
						<div className='min-w-0 rounded-lg bg-base-200/50 p-3'>
							<p className='mb-2 flex items-center gap-2 text-sm font-semibold text-base-content/70'>
								<FaKey aria-hidden='true' /> Session token
							</p>
							<div className='flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center'>
								<code className='min-w-0 break-all rounded-lg bg-base-300 px-3 py-2 text-xs'>
									{showSessionToken
										? session.token
										: 'HIDDEN'}
								</code>
								<button
									className='btn btn-sm btn-outline min-h-11 w-full shrink-0 rounded-xl sm:w-auto'
									onClick={() =>
										setShowSessionToken(!showSessionToken)
									}
									type='button'
									aria-pressed={showSessionToken}
									aria-label={
										showSessionToken
											? 'Hide session token'
											: 'Show session token'
									}
								>
									{showSessionToken ? 'Hide' : 'Show'}
								</button>
							</div>
						</div>
					</div>

					<dl className='grid min-w-0 gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4'>
						<div className='min-w-0'>
							<dt className='flex items-center gap-2 font-semibold text-base-content/70'>
								<FaNetworkWired aria-hidden='true' /> IP Address
							</dt>
							<dd className='mt-1 break-all'>
								{session.ipAddress || 'Unknown'}
							</dd>
						</div>
						<div className='min-w-0'>
							<dt className='flex items-center gap-2 font-semibold text-base-content/70'>
								<FaDesktop aria-hidden='true' /> Device
							</dt>
							<dd className='mt-1 break-words'>
								{session.userAgent && os.name
									? `${os.name}, ${browser.name} ${browser.major}`
									: 'Unknown'}
							</dd>
						</div>
						<div className='min-w-0'>
							<dt className='flex items-center gap-2 font-semibold text-base-content/70'>
								<FaClock aria-hidden='true' /> Expires
							</dt>
							<dd className='mt-1'>
								{new Date(session.expiresAt).toLocaleString(
									'pl-PL'
								)}
							</dd>
						</div>
						<div className='min-w-0'>
							<dt className='flex items-center gap-2 font-semibold text-base-content/70'>
								<FaCalendarAlt aria-hidden='true' /> Created /
								Updated
							</dt>
							<dd className='mt-1 break-words'>
								{new Date(session.createdAt).toLocaleString(
									'pl-PL'
								)}{' '}
								/
								{new Date(session.updatedAt).toLocaleString(
									'pl-PL'
								)}
							</dd>
						</div>
					</dl>
				</div>
				<button
					type='button'
					className='btn btn-error btn-outline w-full shrink-0 lg:w-auto'
					onClick={() => revokeSession(session.token)}
				>
					{session.token === currentSessionToken
						? 'Sign out'
						: 'Revoke'}
				</button>
			</div>
		</article>
	)
}
