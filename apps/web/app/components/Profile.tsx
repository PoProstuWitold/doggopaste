export interface ProfileProps {
	currentSession: {
		session: {
			id: string
			expiresAt: Date
			token: string
			createdAt: Date
			updatedAt: Date
			ipAddress?: string | null
			userAgent?: string | null
		}
		user: {
			id: string
			name: string
			email: string
			emailVerified: boolean
			role: string
			createdAt: Date
			updatedAt: Date
		}
	}
}

export const Profile: React.FC<ProfileProps> = ({ currentSession }) => {
	return (
		<>
			<details className='collapse bg-base-200 collapse-arrow'>
				<summary className='collapse-title text-xl font-medium'>
					Profile & Current Session
				</summary>
				<div className='collapse-content'>
					<ul className='list-disc ml-5'>
						<li>
							<strong>ID:</strong> {currentSession.session.id}
						</li>
						<li>
							<strong>Expires At:</strong>{' '}
							{new Date(
								currentSession.session.expiresAt
							).toString()}
						</li>
						<li>
							<strong>Token:</strong>{' '}
							{currentSession.session.token}
						</li>
						<li>
							<strong>Created At:</strong>{' '}
							{new Date(
								currentSession.session.createdAt
							).toString()}
						</li>
						<li>
							<strong>Updated At:</strong>{' '}
							{new Date(
								currentSession.session.updatedAt
							).toString()}
						</li>
						<li>
							<strong>IP Address:</strong>{' '}
							{currentSession.session.ipAddress || 'Unknown'}
						</li>
						<li>
							<strong>User Agent:</strong>{' '}
							{currentSession.session.userAgent || 'Unknown'}
						</li>
					</ul>
					<h3 className='mt-4 font-semibold'>User Information</h3>
					<ul className='list-disc ml-5'>
						<li>
							<strong>ID:</strong> {currentSession.user.id}
						</li>
						<li>
							<strong>Name:</strong> {currentSession.user.name}
						</li>
						<li>
							<strong>Email:</strong> {currentSession.user.email}
						</li>
						<li>
							<strong>Email Verified:</strong>{' '}
							{currentSession.user.emailVerified ? 'Yes' : 'No'}
						</li>
						<li>
							<strong>Role:</strong> {currentSession.user.role}
						</li>
						<li>
							<strong>Created At:</strong>{' '}
							{new Date(currentSession.user.createdAt).toString()}
						</li>
						<li>
							<strong>Updated At:</strong>{' '}
							{new Date(currentSession.user.updatedAt).toString()}
						</li>
					</ul>
				</div>
			</details>
		</>
	)
}
