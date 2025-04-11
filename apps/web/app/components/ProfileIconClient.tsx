'use client'

import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ProfileIconClientProps {
	user?: {
		name: string
	}
}

export const ProfileIconClient: React.FC<ProfileIconClientProps> = ({
	user
}) => {
	const authClient = createDynamicAuthClient()
	const handleSignOut = async () => {
		try {
			const { data, error } = await authClient.signOut()
			if (error) {
				console.error('Error during sign out:', error)
			}
			// Optionally reload the page or redirect to the login page
			toast.success(`Signed out successfully. Bye ${user?.name}!`)
			await wait(1000)
			window.location.reload()
		} catch (err) {
			console.error('Unexpected error:', err)
		}
	}

	return (
		<>
			{/* Show dropdown if user is logged in */}
			{user ? (
				<div className='dropdown dropdown-start'>
					<button type='button' className='btn btn-outline'>
						{user.name || 'Profile'}
					</button>
					<ul className='dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow gap-3'>
						<li>
							<Link
								className='btn btn-primary btn-sm'
								href='/profile'
							>
								Profile
							</Link>
						</li>
						<li>
							<button
								onClick={handleSignOut}
								type='button'
								className='w-full btn btn-error btn-sm'
							>
								Sign Out
							</button>
						</li>
					</ul>
				</div>
			) : (
				// Show login link if no user is logged in
				<Link href='/login' className='btn btn-outline'>
					Login
				</Link>
			)}
		</>
	)
}
