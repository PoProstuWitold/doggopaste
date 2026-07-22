import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BiInfoCircle } from 'react-icons/bi'
import {
	FaCalendarAlt,
	FaFolderOpen,
	FaUser,
	FaUserShield
} from 'react-icons/fa'
import { FiEdit } from 'react-icons/fi'
import { PasteCard } from '@/app/components/custom/PasteCard'
import type {
	ApiDataResponse,
	Folder,
	PaginatedResponse,
	PasteSummary
} from '@/app/types'
import { apiRequest } from '@/app/utils/api'
import { getPublicUserByName } from '@/app/utils/api-data'
import { buildFolderTree, renderFolderBranch } from '@/app/utils/folderHelpers'
import { getCurrentViewer } from '@/app/utils/session'

export const dynamic = 'force-dynamic'

type Params = { name: string }
type Search = { page?: string }

export async function generateMetadata({
	params
}: {
	params: Promise<Params>
}): Promise<Metadata> {
	const { name } = await params
	const user = await getPublicUserByName(name)
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
	const viewer = await getCurrentViewer()

	const { name } = await params
	const sp = await searchParams
	const page = Number.parseInt(sp?.page || '1', 10)
	const limit = 10
	const offset = (page - 1) * limit

	const user = await getPublicUserByName(name)
	if (!user) notFound()

	const cookieHeader = await cookies()
	const qs = new URLSearchParams({
		userId: user.id,
		limit: String(limit),
		offset: String(offset)
	})

	const result = await apiRequest<PaginatedResponse<PasteSummary>>(
		`/api/user/pastes?${qs.toString()}`,
		{
			headers: { Cookie: cookieHeader.toString() },
			cache: 'no-store'
		}
	)
	if (!result.ok || !result.data) throw new Error('Failed to load pastes')

	const pastes = result.data.data ?? []
	const total = result.data.total ?? 0

	const label = user.name || name
	const joined = new Date(user.createdAt).toLocaleDateString('pl-PL')
	const RoleIcon = user.role === 'admin' ? FaUserShield : FaUser

	let folders: Folder[] = []
	if (viewer?.id === user.id) {
		const foldersResult = await apiRequest<ApiDataResponse<Folder[]>>(
			'/api/folders/all',
			{
				headers: { Cookie: cookieHeader.toString() },
				cache: 'no-store'
			}
		)
		if (foldersResult.ok) {
			folders = foldersResult.data?.data ?? []
		}
	}

	return (
		<div className='max-w-5xl mx-auto px-6 py-6 flex flex-col gap-10'>
			{/* Check if logged matches fetched user */}
			{viewer?.id === user.id && (
				<div className='alert alert-info'>
					<BiInfoCircle className='w-10 h-10' />
					<span>
						You are viewing your own public profile. Feel free to
						share this page with anyone. Your private and unlisted
						pastes as well as folders and settings are not visible
						here.
					</span>
				</div>
			)}
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

			{viewer?.id === user.id && (
				<div className='card bg-base-100 border border-base-300 shadow-sm'>
					<div className='card-body p-4 md:p-6'>
						<h2 className='text-lg md:text-xl font-semibold flex items-center gap-2'>
							<FaFolderOpen className='w-6 h-6 text-primary' />
							Your Folders
						</h2>

						{folders.length > 0 ? (
							<div className='mt-3'>
								{renderFolderBranch(
									buildFolderTree(folders),
									null,
									0,
									viewer.name
								)}
							</div>
						) : (
							<div className='mt-2 text-sm text-base-content/70'>
								You don&apos;t have any folders yet.
							</div>
						)}
						{/* Managing folders */}
						<Link
							href={`/u/${viewer.name}/folders`}
							className='btn btn-primary btn-ghost'
						>
							<FiEdit className='w-5 h-5' />
							Manage Folders
						</Link>
					</div>
				</div>
			)}

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
					This user has no pastes.
				</div>
			)}
		</div>
	)
}
