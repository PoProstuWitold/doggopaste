import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { FaGithub } from 'react-icons/fa6'
import { FiPlus } from 'react-icons/fi'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Public Realtime Editors',
	description: 'Check out the latest public realtime editors on DoggoPaste!'
}

export default async function PublicRealtimePastes() {
	const generateRandomSlug = () => {
		const characters =
			'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
		const slugLength = 8
		let slug = ''
		for (let i = 0; i < slugLength; i++) {
			const randomIndex = Math.floor(Math.random() * characters.length)
			slug += characters.charAt(randomIndex)
		}
		return slug
	}

	return (
		<div className='max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10'>
			<div className='flex flex-col items-center gap-4 text-center'>
				<div className='flex flex-col items-center gap-10 md:gap-2'>
					<div className='flex flex-col md:flex-row text-5xl md:p-2 items-center gap-1 font-extrabold'>
						<Image
							src='/img/doggo.svg'
							alt='Doggo'
							className='w-24 h-24'
							width={24}
							height={24}
						/>
						<span>DoggoPaste</span>
					</div>
					<h1 className='text-4xl font-bold'>
						"Drop your code, let Doggo fetch it!"
					</h1>
					<p className='text-lg text-base-content/60'>
						Share your code snippets with the world in a few clicks!
					</p>
				</div>
				<div className='flex flex-col sm:flex-row items-center gap-3 justify-center w-full'>
					<a
						href={`/r/${generateRandomSlug()}`}
						rel='noopener noreferrer'
						aria-label='New Realtime Editor'
						className='btn btn-accent btn-wide gap-2'
					>
						<FiPlus className='w-5 h-5' />
						New Realtime Editor
					</a>
					<Link
						href='https://github.com/PoProstuWitold/doggopaste'
						target='_blank'
						rel='noopener noreferrer'
						aria-label='Source Code'
						className='btn btn-outline btn-wide gap-2 btn-secondary'
					>
						<FaGithub className='w-5 h-5' />
						Source Code
					</Link>
				</div>
			</div>
		</div>
	)
}
