'use client'

import Link from 'next/link'
import toast from 'react-hot-toast'
import { BiLogIn } from 'react-icons/bi'
import { FaUserAlt } from 'react-icons/fa'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'

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
			const { error } = await authClient.signOut()
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
				<div className='dropdown dropdown-end'>
					<button
						type='button'
						className='btn btn-ghost'
						aria-label='User menu'
					>
						<FaUserAlt className='w-5 h-5' />
					</button>
					<ul className='dropdown-content menu bg-base-100 rounded-box z-[1] p-2 w-52 shadow gap-3'>
						<li>Hello, {user.name}!</li>
						<li>
							<Link
								className='btn btn-primary btn-sm'
								href='/profile'
								aria-label='Go to profile'
							>
								Profile
							</Link>
						</li>
						<li>
							<button
								onClick={handleSignOut}
								type='button'
								className='w-full btn btn-error btn-sm'
								aria-label='Sign out'
							>
								Sign Out
							</button>
						</li>
					</ul>
				</div>
			) : (
				<Link href='/login' aria-label='Go to login'>
					<button
						type='button'
						className='btn btn-ghost'
						aria-label='Login'
					>
						<BiLogIn className='w-7 h-7' />
					</button>
				</Link>
			)}
		</>
	)
}
