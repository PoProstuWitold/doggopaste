'use client'
import { useState } from 'react'
import { FaCheck } from 'react-icons/fa'
import { FaXmark } from 'react-icons/fa6'
import type { Session, User } from '../../types'
import { ChangePassword } from './ChangePassword'
import { CustomDialog } from './CustomDialog'
import { EditUser } from './EditUser'

export interface ProfileProps {
	currentSession: {
		session: Session
		user: User
	}
	hasCredentialAccount: boolean
}

export const Profile: React.FC<ProfileProps> = ({
	currentSession,
	hasCredentialAccount
}) => {
	const [showId, setShowId] = useState<boolean>(false)

	return (
		<details className='collapse bg-base-200 collapse-arrow'>
			<summary className='collapse-title text-xl font-medium'>
				<div className='flex items-center gap-2'>
					<p>Profile</p>
					<span className='badge badge-accent'>
						{currentSession.user.role}
					</span>
				</div>
			</summary>
			<div className='collapse-content'>
				<div className='grid grid-cols-1 gap-2'>
					<div className='flex md:flex-row md:items-center gap-2 flex-col'>
						<strong>ID:</strong>
						<div className='flex items-center gap-2'>
							<span className='badge badge-neutral'>
								{showId ? currentSession.user.id : 'HIDDEN'}
							</span>
							<button
								className='btn btn-xs btn-outline rounded-2xl'
								onClick={() => setShowId(!showId)}
								type='button'
							>
								{showId ? 'Hide' : 'Show'}
							</button>
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<strong>Name:</strong> {currentSession.user.name}
					</div>
					<div className='flex md:flex-row md:items-center gap-2 flex-col'>
						<div className='flex items-center gap-2'>
							<strong>Email:</strong>
							{currentSession.user.email}
							{currentSession.user.emailVerified ? (
								<div className='badge badge-outline badge-success text-xs'>
									<span className='flex items-center gap-1'>
										Verified <FaCheck />
									</span>
								</div>
							) : (
								<div className='badge badge-outline badge-error text-xs'>
									<span className='flex items-center gap-1'>
										Not Verified <FaXmark />
									</span>
								</div>
							)}
						</div>
					</div>
					<div className='flex md:flex-row md:items-center gap-2 flex-col'>
						<strong>Created/Updated:</strong>
						{new Date(currentSession.user.createdAt).toLocaleString(
							'pl-PL'
						)}
						/
						{new Date(currentSession.user.updatedAt).toLocaleString(
							'pl-PL'
						)}
					</div>
					<div className='flex md:flex-row md:items-center gap-2 flex-col'>
						<CustomDialog
							btnContent='Edit User'
							title='Edit User'
							description='Edit your user information'
						>
							<EditUser />
						</CustomDialog>
						{hasCredentialAccount ? (
							<CustomDialog
								btnContent='Change Password'
								title='Change Password'
								description='Change your password'
							>
								<ChangePassword />
							</CustomDialog>
						) : null}
					</div>
				</div>
			</div>
		</details>
	)
}
