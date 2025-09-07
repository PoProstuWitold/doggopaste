import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FaCalendarAlt, FaUser, FaUserShield } from 'react-icons/fa'
import { PasteCard } from '@/app/components/custom/PasteCard'
import type { Paste, User } from '@/app/types'
import { getBaseApiUrl } from '@/app/utils/functions'

export const dynamic = 'force-dynamic'

type Params = { name: string }
type Search = { page?: string }

async function fetchUserByName(name: string): Promise<User | null> {
	const res = await fetch(
		`${getBaseApiUrl()}/api/user/name/${encodeURIComponent(name)}`,
		{
			next: { revalidate: 0 },
			cache: 'no-store'
		}
	)
	if (res.status === 404) return null
	if (!res.ok) throw new Error('Failed to load user')
	const json = await res.json()
	return json.data as User
}

export async function generateMetadata({
	params
}: {
	params: Promise<Params>
}): Promise<Metadata> {
	const { name } = await params
	const user = await fetchUserByName(name)
	if (!user) {
		return {
			title: 'User Not Found',
			description: 'This profile does not exist.'
		}
	}
	const label = user.name || name
	return {
		title: `${label}'s DoggoPaste`,
		description: `Public pastes by ${label} on DoggoPaste`
	}
}

export default async function UserPage({
	params,
	searchParams
}: {
	params: Promise<Params>
	searchParams?: Promise<Search>
}) {
	const { name } = await params
	const sp = await searchParams
	const page = Number.parseInt(sp?.page || '1', 10)
	const limit = 10
	const offset = (page - 1) * limit

	const user = await fetchUserByName(name)
	if (!user) notFound()

	const cookieHeader = await cookies()
	const qs = new URLSearchParams({
		userId: user.id,
		limit: String(limit),
		offset: String(offset)
	})

	const res = await fetch(
		`${getBaseApiUrl()}/api/user/pastes?${qs.toString()}`,
		{
			headers: { Cookie: cookieHeader.toString() },
			next: { revalidate: 0 },
			cache: 'no-store'
		}
	)
	if (!res.ok) throw new Error('Failed to load pastes')

	const json = (await res.json()) as { data: Paste[]; total: number }
	const pastes = json.data ?? []
	const total = json.total ?? 0

	const label = user.name || name
	const joined = new Date(user.createdAt).toLocaleDateString('pl-PL')
	const RoleIcon = user.role === 'admin' ? FaUserShield : FaUser

	return (
		<div className='max-w-5xl mx-auto px-6 py-12 flex flex-col gap-10'>
			<div className='card bg-base-100 border border-base-300 shadow-sm'>
				<div className='card-body p-4 md:p-6'>
					<div className='flex items-center gap-3'>
						<div className='w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center'>
							<RoleIcon className='w-5 h-5 text-primary' />
						</div>
						<div>
							<div className='flex items-center gap-3'>
								<h1 className='text-lg md:text-xl font-semibold'>
									{label}
								</h1>
								<span
									className={`badge ${user.role === 'admin' ? 'badge-error' : 'badge-ghost'}`}
									title='User role'
								>
									{user.role}
								</span>
							</div>
							<div className='text-sm text-base-content/60 flex items-center gap-3'>
								<span
									className='inline-flex items-center gap-2'
									title='Joined'
								>
									<FaCalendarAlt className='w-4 h-4' />
									<span>Joined {joined}</span>
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className='divider'>{`${label}'s DoggoPaste`}</div>

			<ul className='flex flex-col gap-6'>
				{pastes.map((paste) => (
					<PasteCard paste={paste} key={paste.id} />
				))}
			</ul>

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
							className={`join-item btn btn-sm ${page * limit >= total ? 'btn-disabled' : ''}`}
						>
							»
						</Link>
					</div>
				</div>
			) : (
				<div className='text-center text-lg font-semibold text-base-content/60'>
					This user has no public pastes.
				</div>
			)}
		</div>
	)
}
