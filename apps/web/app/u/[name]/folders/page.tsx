// app/u/[name]/folders/page.tsx
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FaFolder, FaInfo, FaLongArrowAltLeft, FaSitemap } from 'react-icons/fa'
import { FolderCard } from '@/app/components/custom/FolderCard'
import { NewFolderCard } from '@/app/components/custom/NewFolderCard'
import type { ApiDataResponse, Folder } from '@/app/types'
import { apiRequest } from '@/app/utils/api'
import { getPublicUserByName } from '@/app/utils/api-data'
import { getCurrentViewer } from '@/app/utils/session'

export const dynamic = 'force-dynamic'

type Params = { name: string }

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
		title: `${label}'s Folders`,
		description: `Folders owned by ${label} on DoggoPaste`
	}
}

export default async function FoldersPage({
	params
}: {
	params: Promise<Params>
}) {
	const { name } = await params
	const viewer = await getCurrentViewer()
	const foldersUser = await getPublicUserByName(name)
	if (!foldersUser) notFound()

	const isOwn = viewer?.id === foldersUser.id

	let folders: Folder[] = []
	if (isOwn) {
		const cookieHeader = await cookies()
		const result = await apiRequest<ApiDataResponse<Folder[]>>(
			'/api/folders/all',
			{
				headers: { Cookie: cookieHeader.toString() },
				cache: 'no-store'
			}
		)
		if (result.ok) {
			folders = result.data?.data ?? []
		}
	}

	// tylko top-level (parentFolderId === null)
	const topLevelFolders = isOwn
		? folders.filter((f) => f.parentFolderId === null)
		: []

	return (
		<div className='mx-auto w-full p-5 space-y-10'>
			{/* back to profile */}
			<div>
				<Link
					href={`/u/${encodeURIComponent(foldersUser.name)}`}
					className='inline-flex items-center gap-2 btn btn-link'
				>
					<FaLongArrowAltLeft className='w-5 h-5' />
					<span>Back to profile</span>
				</Link>
			</div>

			{/* header */}
			<header className='space-y-2 flex flex-col'>
				<div className='flex items-start gap-3'>
					<FaFolder className='w-14 h-14 text-primary' />
					<div className='space-y-1'>
						<div className='flex flex-wrap items-center gap-2'>
							<h1 className='text-xl font-semibold'>
								{foldersUser.name}&apos;s Folders
							</h1>

							{isOwn && (
								<span className='badge badge-info font-semibold'>
									YOU
								</span>
							)}
						</div>
						<div className='flex flex-wrap items-center gap-2 text-muted-foreground'>
							<span className='badge badge-ghost gap-1'>
								<FaSitemap className='w-5 h-5' />
								Top level
							</span>
						</div>
					</div>
				</div>
				<span className='badge badge-ghost gap-1 font-mono p-5'>
					<FaInfo className='w-5 h-5' />
					{isOwn
						? 'These are your top-level folders.'
						: `${name}'s top-level folders.`}
				</span>
			</header>

			<section className='grid gap-4 place-items-stretch grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10'>
				{isOwn && <NewFolderCard />}

				{isOwn &&
					topLevelFolders.map((folder) => (
						<FolderCard
							key={folder.id}
							folder={folder}
							username={foldersUser.name}
						/>
					))}

				{isOwn && topLevelFolders.length === 0 && (
					<p className='text-muted-foreground col-span-full my-2'>
						You don&apos;t have any folders yet.
					</p>
				)}

				{!isOwn && (
					<p className='text-muted-foreground col-span-full my-2'>
						This user&apos;s folders are private.
					</p>
				)}
			</section>
		</div>
	)
}
