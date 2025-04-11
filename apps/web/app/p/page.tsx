import type { Metadata } from 'next'
import Link from 'next/link'
import { FaGithub, FaShieldDog } from 'react-icons/fa6'
import { FiPlus } from 'react-icons/fi'
import { PasteCard } from '../components/PasteCard'
import type { Paste } from '../types'
import { getBaseApiUrl } from '../utils/functions'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Public Pastes',
	description: 'Check out the latest public pastes on DoggoPaste!'
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

	const res = await fetch(
		`${getBaseApiUrl()}/api/pastes?limit=${limit}&offset=${offset}`,
		{ next: { revalidate: 0 } }
	)

	const json = await res.json()
	const pastes: Paste[] = json.data
	const total = json.total

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
						href='/p/create'
						className='btn btn-accent btn-wide gap-2'
					>
						<FiPlus className='w-5 h-5' />
						New Paste
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

			<div className='divider'>Public Pastes</div>

			{/* Paste List */}
			<ul className='flex flex-col gap-6'>
				{pastes.map((paste) => (
					<PasteCard paste={paste} key={paste.id} />
				))}
			</ul>

			{/* Pagination */}
			{pastes.length > 0 ? (
				<div className='flex justify-center'>
					<div className='join'>
						<Link
							href={`?page=${page - 1}`}
							className={`join-item btn btn-sm ${page <= 1 ? 'btn-disabled' : ''}`}
						>
							«
						</Link>
						<button
							type='button'
							className='join-item btn btn-sm btn-ghost no-animation cursor-default'
						>
							Page {page} of {Math.ceil(total / limit)}
						</button>
						<Link
							href={`?page=${page + 1}`}
							className={`join-item btn btn-sm ${
								page * limit >= total ? 'btn-disabled' : ''
							}`}
						>
							»
						</Link>
					</div>
				</div>
			) : (
				<div className='text-center text-lg font-semibold mt-8 text-base-content/60'>
					No public pastes found.
				</div>
			)}
		</div>
	)
}
