import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BiInfoCircle } from 'react-icons/bi'
import {
	FaCalendarAlt,
	FaFileAlt,
	FaFolderOpen,
	FaRegFolderOpen,
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
	const joinedAt = new Date(user.createdAt)
	const joined = joinedAt.toLocaleDateString('pl-PL')
	const RoleIcon = user.role === 'admin' ? FaUserShield : FaUser
	const isOwnProfile = viewer?.id === user.id

	let folders: Folder[] = []
	if (isOwnProfile) {
		const foldersResult = await apiRequest<ApiDataResponse<Folder[]>>(
			'/api/folders/all',
			{
				headers: { Cookie: cookieHeader.toString() },
				cache: 'no-store'
			}
		)
		if (foldersResult.ok) folders = foldersResult.data?.data ?? []
	}

	return (
		<div className='mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12'>
			{isOwnProfile && (
				<div
					className='alert border border-info/25 bg-info/10 text-base-content'
					role='status'
				>
					<BiInfoCircle
						className='h-6 w-6 shrink-0 text-info'
						aria-hidden='true'
					/>
					<span className='min-w-0 text-sm leading-relaxed sm:text-base'>
						This is your public profile. Private and unlisted
						pastes, folders and account settings remain visible only
						to you.
					</span>
				</div>
			)}

			<header className='overflow-hidden rounded-3xl border border-base-300 bg-base-100'>
				<div className='grid gap-6 p-5 sm:p-7 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center'>
					<div className='flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary sm:h-24 sm:w-24'>
						<RoleIcon
							className='h-9 w-9 sm:h-11 sm:w-11'
							aria-hidden='true'
						/>
					</div>

					<div className='min-w-0'>
						<div className='flex min-w-0 flex-wrap items-center gap-2'>
							<h1 className='min-w-0 break-words text-3xl font-black tracking-tight sm:text-4xl'>
								{label}
							</h1>
							<span
								className={`badge gap-1 ${user.role === 'admin' ? 'badge-error' : 'badge-ghost'}`}
							>
								<RoleIcon
									className='h-3 w-3'
									aria-hidden='true'
								/>
								{user.role || 'user'}
							</span>
						</div>
						<p className='mt-2 flex flex-wrap items-center gap-2 text-sm text-base-content/65'>
							<FaCalendarAlt aria-hidden='true' />
							Joined{' '}
							<time dateTime={joinedAt.toISOString()}>
								{joined}
							</time>
						</p>
						<p className='mt-4 max-w-2xl break-words text-base-content/70'>
							{isOwnProfile
								? 'Your active static pastes, including items visible only to you.'
								: `Public static pastes shared by ${label} on DoggoPaste.`}
						</p>
					</div>

					<nav
						className='flex flex-wrap gap-2 lg:flex-col'
						aria-label='Profile sections'
					>
						<a
							href='#public-pastes'
							className='btn btn-sm btn-primary'
						>
							<FaFileAlt aria-hidden='true' />{' '}
							{isOwnProfile ? 'Your pastes' : 'Public pastes'}
						</a>
						{isOwnProfile && (
							<Link
								href={`/u/${encodeURIComponent(viewer.name)}/folders`}
								className='btn btn-sm btn-outline'
							>
								<FaFolderOpen aria-hidden='true' /> Folders
							</Link>
						)}
					</nav>
				</div>

				<div className='grid border-t border-base-300 bg-base-200/35 sm:grid-cols-2'>
					<div className='flex items-center gap-3 p-4 sm:p-5'>
						<FaFileAlt
							className='text-primary'
							aria-hidden='true'
						/>
						<div>
							<p className='text-2xl font-bold'>{total}</p>
							<p className='text-sm text-base-content/60'>
								Visible pastes
							</p>
						</div>
					</div>
					{isOwnProfile && (
						<div className='flex items-center gap-3 border-t border-base-300 p-4 sm:border-l sm:border-t-0 sm:p-5'>
							<FaRegFolderOpen
								className='text-primary'
								aria-hidden='true'
							/>
							<div>
								<p className='text-2xl font-bold'>
									{folders.length}
								</p>
								<p className='text-sm text-base-content/60'>
									Private folders
								</p>
							</div>
						</div>
					)}
				</div>
			</header>

			{isOwnProfile && (
				<section
					className='rounded-2xl border border-base-300 bg-base-100 p-5 sm:p-6'
					aria-labelledby='profile-folders-title'
				>
					<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<h2
								id='profile-folders-title'
								className='flex items-center gap-2 text-xl font-bold'
							>
								<FaFolderOpen
									className='text-primary'
									aria-hidden='true'
								/>{' '}
								Your folders
							</h2>
							<p className='mt-1 text-sm text-base-content/65'>
								Only you can see and manage this folder tree.
							</p>
						</div>
						<Link
							href={`/u/${encodeURIComponent(viewer.name)}/folders`}
							className='btn btn-sm btn-outline'
						>
							<FiEdit aria-hidden='true' /> Manage folders
						</Link>
					</div>

					{folders.length > 0 ? (
						<div className='mt-5 min-w-0 overflow-x-auto rounded-xl border border-base-300 bg-base-200/25 p-3 sm:p-4'>
							{renderFolderBranch(
								buildFolderTree(folders),
								null,
								0,
								viewer.name
							)}
						</div>
					) : (
						<div className='mt-5 rounded-xl border border-dashed border-base-300 p-6 text-center text-sm text-base-content/65'>
							You don&apos;t have any folders yet.
						</div>
					)}
				</section>
			)}

			<section
				id='public-pastes'
				className='scroll-mt-24'
				aria-labelledby='public-pastes-title'
			>
				<div className='mb-5 flex flex-wrap items-end justify-between gap-3'>
					<div className='min-w-0'>
						<p className='text-sm font-semibold uppercase tracking-[0.16em] text-primary'>
							Shared work
						</p>
						<h2
							id='public-pastes-title'
							className='mt-1 min-w-0 break-words text-2xl font-bold'
						>
							{isOwnProfile
								? 'Your visible pastes'
								: `${label}'s public pastes`}
						</h2>
					</div>
					<span className='badge badge-outline gap-1'>
						<FaFileAlt aria-hidden='true' /> {total} total
					</span>
				</div>

				{pastes.length > 0 ? (
					<ul className='flex min-w-0 flex-col gap-4'>
						{pastes.map((paste) => (
							<PasteCard paste={paste} key={paste.id} />
						))}
					</ul>
				) : (
					<div className='rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center'>
						<FaFileAlt
							className='mx-auto h-8 w-8 text-base-content/35'
							aria-hidden='true'
						/>
						<h3 className='mt-3 font-semibold'>
							{isOwnProfile
								? 'No visible pastes yet'
								: 'No public pastes yet'}
						</h3>
						<p className='mt-1 text-sm text-base-content/60'>
							{isOwnProfile
								? 'There are no active pastes to show in your profile.'
								: 'There is nothing public to show on this profile.'}
						</p>
					</div>
				)}

				{pastes.length > 0 && (
					<nav
						className='mt-7 flex justify-center'
						aria-label={
							isOwnProfile
								? 'Visible pastes pagination'
								: 'Public pastes pagination'
						}
					>
						<div className='join'>
							{page > 1 ? (
								<Link
									href={`?page=${page - 1}`}
									className='join-item btn btn-sm'
								>
									<span aria-hidden='true'>«</span>
									<span className='sr-only'>
										Previous page
									</span>
								</Link>
							) : (
								<span
									className='join-item btn btn-sm btn-disabled'
									aria-disabled='true'
								>
									<span aria-hidden='true'>«</span>
									<span className='sr-only'>
										Previous page unavailable
									</span>
								</span>
							)}
							<span
								className='join-item btn btn-sm btn-ghost no-animation cursor-default'
								aria-current='page'
							>
								Page {page} of{' '}
								{Math.max(1, Math.ceil(total / limit))}
							</span>
							{page * limit < total ? (
								<Link
									href={`?page=${page + 1}`}
									className='join-item btn btn-sm'
								>
									<span aria-hidden='true'>»</span>
									<span className='sr-only'>Next page</span>
								</Link>
							) : (
								<span
									className='join-item btn btn-sm btn-disabled'
									aria-disabled='true'
								>
									<span aria-hidden='true'>»</span>
									<span className='sr-only'>
										Next page unavailable
									</span>
								</span>
							)}
						</div>
					</nav>
				)}
			</section>
		</div>
	)
}
