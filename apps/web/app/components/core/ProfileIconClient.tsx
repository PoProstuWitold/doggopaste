'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { BiLogIn, BiLogOut } from 'react-icons/bi'
import { CgProfile } from 'react-icons/cg'
import { FaFileCode, FaUserAlt } from 'react-icons/fa'
import { MdHealthAndSafety } from 'react-icons/md'
import type { User } from '@/app/types'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { wait } from '@/app/utils/functions'

interface ProfileIconClientProps {
	user?: User
}

export const ProfileIconClient: React.FC<ProfileIconClientProps> = ({
	user
}) => {
	const authClient = createDynamicAuthClient()
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef<HTMLDivElement>(null)

	const handleSignOut = async () => {
		try {
			const { error } = await authClient.signOut()
			if (error) console.error('Error during sign out:', error)
			toast.success(`Signed out successfully. Bye ${user?.name}!`)
			await wait(1000)
			window.location.reload()
		} catch (err) {
			console.error('Unexpected error:', err)
		}
	}

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	if (!user) {
		return (
			<Link href='/login' aria-label='Go to login'>
				<button type='button' className='btn btn-ghost'>
					<BiLogIn className='w-7 h-7' />
				</button>
			</Link>
		)
	}

	return (
		<div className='relative' ref={dropdownRef}>
			<button
				type='button'
				aria-label='User menu'
				onClick={() => setIsOpen((prev) => !prev)}
				className='btn btn-ghost'
			>
				<FaUserAlt className='w-5 h-5' />
			</button>

			{isOpen && (
				<div className='absolute right-0 w-52 bg-base-100 rounded-box shadow p-2 z-50 flex flex-col gap-3'>
					<div className='text-sm'>Hello, {user.name}!</div>
					<div className='flex flex-col gap-2'>
						<Link
							href='/profile'
							className='btn btn-outline btn-sm justify-start'
							aria-label='Go to profile'
							onClick={() => setIsOpen(false)}
						>
							<CgProfile className='w-5 h-5' />
							<span>Profile</span>
						</Link>
						<Link
							href={`/u/${user.name}`}
							className='btn btn-outline btn-sm justify-start'
							aria-label='Go to profile'
							onClick={() => setIsOpen(false)}
						>
							<FaFileCode className='w-5 h-5' />
							<span>My DoggoPaste</span>
						</Link>
						{user.role === 'admin' && (
							<Link
								href='/status'
								className='btn btn-outline btn-sm justify-start'
								aria-label='Go to system status'
								onClick={() => setIsOpen(false)}
							>
								<MdHealthAndSafety className='w-5 h-5' />
								<span>System Status</span>
							</Link>
						)}
						<button
							onClick={async () => {
								await handleSignOut()
								setIsOpen(false)
							}}
							type='button'
							className='btn btn-sm btn-error justify-start'
							aria-label='Sign out'
						>
							<BiLogOut className='w-5 h-5' />
							<span>Sign Out</span>
						</button>
					</div>
				</div>
			)}
		</div>
	)
}
