import { setThemeScript } from '@/app/utils/functions'
import Link from 'next/link'
import { FaQuestionCircle } from 'react-icons/fa'
import { FaBookOpen, FaFileCode, FaUsers } from 'react-icons/fa6'
import { MobileMenu } from './MobileMenu'
import { ProfileIcon } from './ProfileIcon'
import { ThemeSelector } from './ThemeSelector'
import Image from 'next/image'

export const Navbar: React.FC = () => {
	return (
		<>
			<nav className='lg:bg-clip-padding lg:backdrop-filter lg:backdrop-blur-sm lg:bg-opacity-90 fixed z-50 navbar transition ease-in-out delay-[50ms] bg-base-200'>
				<div className='navbar-start'>
					<div className='lg:hidden'>
						<MobileMenu />
					</div>
					<Link
						href='/'
						className='text-xl normal-case hover:text-primary transition-all ease-in-out delay-[100ms] flex p-2 items-center gap-2 font-extrabold'
					>
						<Image src='./img/doggo.svg' alt='Doggo' className='w-10 h-10' width={10} height={10} />
						<span className='hidden md:flex'>DoggoPaste</span>
					</Link>
				</div>
				<div className='hidden navbar-center lg:flex h-full'>
					<ul className='menu menu-horizontal gap-4 px-2 font-semibold text-base'>
						<li>
							<Link
								href='/p'
								className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary hover:text-neutral-content transition-colors'
							>
								<FaFileCode className='w-5 h-5' />
								Pastes
							</Link>
						</li>
						<li>
							<Link
								href='/r'
								className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary hover:text-neutral-content transition-colors'
							>
								<FaUsers className='w-5 h-5' />
								Collab Editor
							</Link>
						</li>
						<li>
							<Link
								href='/guide'
								className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary hover:text-neutral-content transition-colors'
							>
								<FaBookOpen className='w-5 h-5' />
								Guide
							</Link>
						</li>
						<li>
							<Link
								href='/faq'
								className='flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary hover:text-neutral-content transition-colors'
							>
								<FaQuestionCircle className='w-5 h-5' />
								FAQ
							</Link>
						</li>
					</ul>
				</div>
				<div className='navbar-end'>
					<ul className='flex flex-row items-center px-4 gap-2'>
						<li>
							<ThemeSelector />
						</li>
						<li>
							<ProfileIcon />
						</li>
					</ul>
				</div>
			</nav>
			{/* Inline script to load theme instantly server-side */}
			<script dangerouslySetInnerHTML={{ __html: setThemeScript }} />
		</>
	)
}
