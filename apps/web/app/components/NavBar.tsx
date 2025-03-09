import Link from 'next/link'
import { FaShieldDog } from 'react-icons/fa6'
import { setThemeScript } from '@/app/utils/functions'
import { MobileMenu } from './MobileMenu'
import { ThemeSelector } from './ThemeSelector'
import { ProfileIcon } from './ProfileIcon'

export const Navbar: React.FC = () => {
	return (
		<>
			<nav className='lg:bg-clip-padding lg:backdrop-filter lg:backdrop-blur-sm lg:bg-opacity-90 fixed z-50 navbar transition ease-in-out delay-[50ms] bg-base-200 shadow-primary-content shadow-md'>
				<div className='navbar-start'>
					<div className='lg:hidden'>
						<MobileMenu />
					</div>
					<Link
						href='/'
						className='text-xl normal-case hover:text-primary transition-all ease-in-out delay-[100ms] flex p-2 items-center gap-2 font-extrabold'
					>
						<FaShieldDog className='w-10 h-10' />
						<span className='hidden md:flex'>DoggoPaste</span>
					</Link>
				</div>
				<div className='hidden navbar-center lg:flex h-full'>
					<ul className='p-0 font-semibold menu menu-horizontal menu-lg'>
						<li className='active:bg-primary rounded-lg active:text-neutral-content'>
							<Link href='/link1'>Link 1</Link>
						</li>
						<li className='active:bg-primary rounded-lg active:text-neutral-content'>
							<Link href='/link2'>Link 2</Link>
						</li>
						<li className='active:bg-primary rounded-lg active:text-neutral-content'>
							<Link href='/link3'>Link 3</Link>
						</li>
						<li className='active:bg-primary rounded-lg active:text-neutral-content'>
							<Link href='/link4'>Link 4</Link>
						</li>
					</ul>
				</div>
				<div className='navbar-end'>
					<ul className='flex flex-row items-center px-4 gap-4'>
						<li>
							<ProfileIcon />
						</li>
						<li>
							<ThemeSelector defaultTheme='system' />
						</li>
					</ul>
				</div>
			</nav>
			{/* Inline script to load theme instantly server-side */}
			<script dangerouslySetInnerHTML={{ __html: setThemeScript }} />
		</>
	)
}
