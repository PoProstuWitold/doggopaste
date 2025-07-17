'use client'

import {
	Menu,
	MenuButton,
	MenuItem,
	MenuItems,
	Transition
} from '@headlessui/react'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment } from 'react'
import {
	AiFillBook,
	AiOutlineClose,
	AiOutlineInfoCircle,
	AiOutlineMail,
	AiOutlineMenu
} from 'react-icons/ai'
import { MdComputer } from 'react-icons/md'

export const MobileMenu = () => {
	return (
		<Menu as='div' className='relative z-50'>
			{({ open, close }) => (
				<>
					<MenuButton
						className='btn btn-ghost focus:outline-none'
						title='Mobile Menu'
					>
						<AiOutlineMenu className='w-7 h-7 transition-all duration-200' />
					</MenuButton>

					{/* Overlay */}
					<Transition
						as={Fragment}
						show={open}
						enter='transition-opacity ease-out duration-300'
						enterFrom='opacity-0'
						enterTo='opacity-100'
						leave='transition-opacity ease-in duration-200'
						leaveFrom='opacity-100'
						leaveTo='opacity-0'
					>
						<button
							className='fixed inset-0 bg-black/20 z-40'
							onClick={() => close()}
							type='button'
						/>
					</Transition>
					<Transition
						as={Fragment}
						show={open}
						enter='transition-transform ease-out duration-300'
						enterFrom='-translate-x-full'
						enterTo='translate-x-0'
						leave='transition-transform ease-in duration-200'
						leaveFrom='translate-x-0'
						leaveTo='-translate-x-full'
					>
						<MenuItems
							static
							className='fixed top-0 left-0 z-50 w-4/5 max-w-xs h-full bg-base-200 p-4 flex flex-col gap-4 font-semibold shadow-lg focus:outline-none'
						>
							<div className='flex flex-row'>
								<button
									onClick={() => close()}
									className='btn btn-ghost'
									title='Mobile Menu'
									type='button'
								>
									<AiOutlineClose className='w-7 h-7 transition-all duration-200' />
								</button>
								<Link
									href='/'
									onClick={() => close()}
									className='text-xl normal-case hover:text-primary transition-all ease-in-out delay-[100ms] flex items-center gap-2 font-extrabold'
								>
									<Image
										src='/img/doggo.svg'
										alt='Doggo'
										className='w-10 h-10'
										width={10}
										height={10}
									/>
									<span className='flex'>DoggoPaste</span>
								</Link>
							</div>

							{[
								{
									href: '/p',
									label: 'Pastes',
									icon: (
										<AiOutlineInfoCircle className='w-5 h-5' />
									)
								},
								{
									href: '/r',
									label: 'Collab Editor',
									icon: <MdComputer className='w-5 h-5' />
								},
								{
									href: '/guide',
									label: 'Guide',
									icon: <AiOutlineMail className='w-5 h-5' />
								},
								{
									href: '/faq',
									label: 'FAQ',
									icon: <AiFillBook className='w-5 h-5' />
								}
							].map(({ href, label, icon }) => (
								<MenuItem key={href}>
									<Link
										href={href}
										onClick={() => close()}
										className='flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary hover:text-neutral-content transition-colors w-full'
									>
										{icon}
										{label}
									</Link>
								</MenuItem>
							))}
						</MenuItems>
					</Transition>
				</>
			)}
		</Menu>
	)
}
