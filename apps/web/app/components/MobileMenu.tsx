'use client'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import Link from 'next/link'
import { AiFillBook, AiOutlineMenu } from 'react-icons/ai'
import { AiOutlineInfoCircle } from 'react-icons/ai'
import { AiOutlineClose, AiOutlineMail } from 'react-icons/ai'
import { MdComputer } from 'react-icons/md'

export const MobileMenu = () => {
	return (
		<Menu as='div' className='z-50'>
			{({ open }) => (
				<>
					<MenuButton
						className='justify-center btn btn-ghost'
						title='Mobile Menu'
					>
						<AiOutlineClose
							className={`w-7 h-7 ${open ? '' : 'hidden'}`}
						/>
						<AiOutlineMenu
							className={`w-7 h-7 ${open ? 'hidden' : ''}`}
						/>
					</MenuButton>
					<MenuItems className='absolute left-0 top-0 w-screen h-screen bg-base-200 px-6 py-4 flex flex-col gap-4 font-semibold transition ease-in-out delay-[50ms] menu'>
						<MenuItem>
							<h2 className='text-xl font-bold mb-2'>Menu</h2>
						</MenuItem>
						<MenuItem>
							<Link
								href='/p'
								className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary hover:text-neutral-content transition-colors w-full'
							>
								<AiOutlineInfoCircle className='w-5 h-5' />
								Pastes
							</Link>
						</MenuItem>
						<MenuItem>
							<Link
								href='/r'
								className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary hover:text-neutral-content transition-colors w-full'
							>
								<MdComputer className='w-5 h-5' />
								Collab Editor
							</Link>
						</MenuItem>

						<MenuItem>
							<Link
								href='/guide'
								className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary hover:text-neutral-content transition-colors w-full'
							>
								<AiOutlineMail className='w-5 h-5' />
								Guide
							</Link>
						</MenuItem>
						<MenuItem>
							<Link
								href='/faq'
								className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary hover:text-neutral-content transition-colors w-full'
							>
								<AiFillBook className='w-5 h-5' />
								FAQ
							</Link>
						</MenuItem>
					</MenuItems>
				</>
			)}
		</Menu>
	)
}
