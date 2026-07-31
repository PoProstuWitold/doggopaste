'use client'
import { useState } from 'react'
import {
	FaCalendarAlt,
	FaCheck,
	FaEnvelope,
	FaFingerprint,
	FaKey,
	FaPen,
	FaUser
} from 'react-icons/fa'
import { FaXmark } from 'react-icons/fa6'
import type { ProfileUserDto } from '../../types'
import { ChangePassword } from './ChangePassword'
import { CustomDialog } from './CustomDialog'
import { EditUser } from './EditUser'

export interface ProfileProps {
	currentUser: ProfileUserDto
	hasCredentialAccount: boolean
}

export const Profile: React.FC<ProfileProps> = ({
	currentUser,
	hasCredentialAccount
}) => {
	const [showId, setShowId] = useState<boolean>(false)

	return (
		<section aria-labelledby='profile-settings-heading'>
			<h2 id='profile-settings-heading' className='sr-only'>
				Profile
			</h2>
			<details className='collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100'>
				<summary className='collapse-title min-h-0 p-4 pr-12 sm:p-5 sm:pr-12'>
					<span className='flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
						<span className='flex min-w-0 items-center gap-3'>
							<span className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
								<FaUser aria-hidden='true' />
							</span>
							<span className='min-w-0'>
								<span className='block text-lg font-semibold'>
									Profile
								</span>
								<span className='block text-sm font-normal text-base-content/65'>
									Your identity and account details
								</span>
							</span>
						</span>
						<span className='badge badge-accent h-auto max-w-full gap-1.5 py-1'>
							<FaUser className='size-3' aria-hidden='true' />
							<span className='truncate'>{currentUser.role}</span>
						</span>
					</span>
				</summary>
				<div className='collapse-content px-4 pb-4 sm:px-5 sm:pb-5'>
					<dl className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
						<div className='min-w-0 rounded-xl border border-base-300 bg-base-200/35 p-4 sm:col-span-2'>
							<dt className='mb-2 flex items-center gap-2 text-sm font-semibold text-base-content/70'>
								<FaFingerprint aria-hidden='true' />
								Account ID
							</dt>
							<dd className='flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center'>
								<code className='min-w-0 break-all rounded-lg bg-base-300 px-3 py-2 text-xs'>
									{showId ? currentUser.id : 'HIDDEN'}
								</code>
								<button
									className='btn btn-sm btn-outline min-h-11 w-full shrink-0 rounded-xl sm:w-auto'
									onClick={() => setShowId(!showId)}
									type='button'
									aria-pressed={showId}
									aria-label={
										showId
											? 'Hide account ID'
											: 'Show account ID'
									}
								>
									{showId ? 'Hide' : 'Show'}
								</button>
							</dd>
						</div>
						<div className='min-w-0 rounded-xl border border-base-300 bg-base-200/35 p-4'>
							<dt className='mb-2 flex items-center gap-2 text-sm font-semibold text-base-content/70'>
								<FaUser aria-hidden='true' />
								Name
							</dt>
							<dd className='break-words font-medium'>
								{currentUser.name}
							</dd>
						</div>
						<div className='min-w-0 rounded-xl border border-base-300 bg-base-200/35 p-4'>
							<dt className='mb-2 flex items-center gap-2 text-sm font-semibold text-base-content/70'>
								<FaEnvelope aria-hidden='true' />
								Email
							</dt>
							<dd className='flex min-w-0 flex-wrap items-center gap-2'>
								<span className='min-w-0 break-all font-medium'>
									{currentUser.email}
								</span>
								{currentUser.emailVerified ? (
									<span className='badge badge-outline badge-success h-auto gap-1 py-1 text-xs'>
										<FaCheck aria-hidden='true' /> Verified
									</span>
								) : (
									<span className='badge badge-outline badge-error h-auto gap-1 py-1 text-xs'>
										<FaXmark aria-hidden='true' /> Not
										Verified
									</span>
								)}
							</dd>
						</div>
						<div className='min-w-0 rounded-xl border border-base-300 bg-base-200/35 p-4 sm:col-span-2'>
							<dt className='mb-2 flex items-center gap-2 text-sm font-semibold text-base-content/70'>
								<FaCalendarAlt aria-hidden='true' />
								Account timeline
							</dt>
							<dd className='grid gap-2 text-sm sm:grid-cols-2'>
								<span>
									<span className='text-base-content/60'>
										Created:{' '}
									</span>
									{new Date(
										currentUser.createdAt
									).toLocaleString('pl-PL')}
								</span>
								<span>
									<span className='text-base-content/60'>
										Updated:{' '}
									</span>
									{new Date(
										currentUser.updatedAt
									).toLocaleString('pl-PL')}
								</span>
							</dd>
						</div>
					</dl>
					<div className='mt-4 flex flex-col gap-2 sm:flex-row'>
						<CustomDialog
							btnContent={
								<>
									<FaPen aria-hidden='true' /> Edit User
								</>
							}
							title='Edit User'
							description='Edit your user information'
							btnClasses='btn btn-outline w-full sm:w-auto'
						>
							<EditUser />
						</CustomDialog>
						{hasCredentialAccount ? (
							<CustomDialog
								btnContent={
									<>
										<FaKey aria-hidden='true' /> Change
										Password
									</>
								}
								title='Change Password'
								description='Change your password'
								btnClasses='btn btn-outline w-full sm:w-auto'
							>
								<ChangePassword />
							</CustomDialog>
						) : null}
					</div>
				</div>
			</details>
		</section>
	)
}
