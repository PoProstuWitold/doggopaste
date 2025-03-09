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
					<MenuItems className='mt-2 gap-4 flex px-6 py-4 absolute left-0 w-screen origin-top-left h-screen transition ease-in-out delay-[50ms] font-semibold bg-base-200 justify-stretch menu menu-vertical'>
						<MenuItem>
							<h2 className='font-bold cursor-pointer text-xl'>
								Menu
							</h2>
						</MenuItem>
						<MenuItem>
							<li className='hover:text-secondary transition-all duration-150'>
								<Link href='/link1'>
									<AiOutlineInfoCircle className='w-7 h-7' />
									Link 1
								</Link>
							</li>
						</MenuItem>
						<MenuItem>
							<li className='hover:text-secondary transition-all duration-150'>
								<Link href='/link2'>
									<MdComputer className='w-7 h-7' /> Link 2
								</Link>
							</li>
						</MenuItem>
						<MenuItem>
							<li className='hover:text-secondary transition-all duration-150'>
								<Link href='/link3'>
									<AiOutlineMail className='w-7 h-7' /> Link 3
								</Link>
							</li>
						</MenuItem>
						<MenuItem>
							<li className='hover:text-secondary transition-all duration-150'>
								<Link href='/link4'>
									<AiFillBook className='w-7 h-7' /> Link 4
								</Link>
							</li>
						</MenuItem>
					</MenuItems>
				</>
			)}
		</Menu>
	)
}
