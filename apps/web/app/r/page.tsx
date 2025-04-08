import type { Metadata } from 'next'
import Link from 'next/link'
import { FaGithub, FaShieldDog } from 'react-icons/fa6'
import { FiPlus } from 'react-icons/fi'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Public Collab Editors',
	description: 'Check out the latest public collab editors on DoggoPaste!'
}

export default async function PublicPastes({
	searchParams
}: {
	searchParams?: Promise<{ page?: string }>
}) {
	const params = await searchParams
	const page = Number.parseInt(params?.page || '1', 10)
	const limit = 10
	const offset = (page - 1) * limit

	return (
		<div className='max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10'>
			<div className='flex flex-col items-center gap-4 text-center'>
				<div className='flex flex-col items-center gap-2'>
					<div className='text-5xl flex p-2 items-center gap-2 font-extrabold'>
						<FaShieldDog className='text-5xl' />
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
					<Link
						href='/r/create'
						className='btn btn-accent btn-wide gap-2'
					>
						<FiPlus className='w-5 h-5' />
						New Collab Editor
					</Link>
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
			<div className='divider'>Public Collab Editors</div>
			<p>No public collab editors</p>
		</div>
	)
}
