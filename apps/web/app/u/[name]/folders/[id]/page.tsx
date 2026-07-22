import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FaFolder, FaFolderOpen, FaLongArrowAltLeft } from 'react-icons/fa'
import { FolderButtons } from '@/app/components/custom/FolderButtons'
import { FolderCard } from '@/app/components/custom/FolderCard'
import { NewFolderCard } from '@/app/components/custom/NewFolderCard'
import { PasteCard } from '@/app/components/custom/PasteCard'
import type { ApiDataResponse, Folder, PasteSummary } from '@/app/types'
import { apiRequest } from '@/app/utils/api'
import { getPublicUserByName } from '@/app/utils/api-data'
import { getCurrentViewer } from '@/app/utils/session'

export const dynamic = 'force-dynamic'

type Params = {
	name: string
	id: string
}

export async function generateMetadata({
	params
}: {
	params: Promise<Params>
}): Promise<Metadata> {
	const { name, id } = await params
	const user = await getPublicUserByName(name)
	if (!user) {
		return {
			title: 'User Not Found',
			description: 'This profile does not exist.'
		}
	}
	const label = user.name || name
	return {
		title: `${label}'s Folder ${id}`,
		description: `Folder ${id} owned by ${label} on DoggoPaste`
	}
}

export default async function FolderPage({
	params
}: {
	params: Promise<Params>
}) {
	const { name, id } = await params
	const viewer = await getCurrentViewer()
	const foldersUser = await getPublicUserByName(name)
	if (!foldersUser) notFound()

	const isOwn = viewer?.id === foldersUser.id

	let folders: Folder[] = []
	let currentFolder: Folder | undefined
	let childFolders: Folder[] = []
	let pastes: PasteSummary[] = []

	if (isOwn) {
		const cookieHeader = await cookies()
		const folderResult = await apiRequest<
			ApiDataResponse<{ folder: Folder; pastes: PasteSummary[] }>
		>(`/api/folders/f/${encodeURIComponent(id)}`, {
			headers: { Cookie: cookieHeader.toString() },
			cache: 'no-store'
		})

		if (!folderResult.ok || !folderResult.data) {
			if (folderResult.status === 404) notFound()
			throw new Error('Failed to load folder')
		}
		currentFolder = folderResult.data.data.folder
		pastes = folderResult.data.data.pastes || []

		const allResult = await apiRequest<ApiDataResponse<Folder[]>>(
			'/api/folders/all',
			{
				headers: { Cookie: cookieHeader.toString() },
				cache: 'no-store'
			}
		)
		if (allResult.ok) {
			folders = allResult.data?.data || []
			childFolders = folders.filter((f) => f.parentFolderId === id)
		}
	}

	return (
		<div className='mx-auto w-full p-5 space-y-10'>
			{/* back to profile */}
			<div>
				<Link
					href={`/u/${encodeURIComponent(foldersUser.name)}/folders/${encodeURIComponent(
						currentFolder?.parentFolderId || ''
					)}`}
					className='inline-flex items-center gap-2 btn btn-link'
				>
					<FaLongArrowAltLeft className='w-5 h-5' />
					<span>Back to parent folder</span>
				</Link>
			</div>

			{/* header */}
			<header className='space-y-2 flex flex-col'>
				<div className='flex items-start gap-3'>
					<FaFolderOpen className='w-14 h-14 text-primary' />
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
								<FaFolder className='w-5 h-5' />
								Inside:{' '}
								{currentFolder?.name ?? 'Unknown folder'}
							</span>
						</div>
					</div>
				</div>
				{isOwn && currentFolder && (
					<FolderButtons
						name={name}
						folderId={currentFolder.id}
						currentName={currentFolder.name}
					/>
				)}
			</header>

			<section className='grid gap-4 place-items-stretch grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10'>
				{isOwn && <NewFolderCard parentId={id} />}

				{isOwn &&
					childFolders.map((folder) => (
						<FolderCard
							key={folder.id}
							folder={folder}
							username={foldersUser.name}
						/>
					))}

				{!isOwn && (
					<p className='text-muted-foreground col-span-full my-2'>
						This user&apos;s folders are private.
					</p>
				)}
			</section>

			{isOwn && (
				<div className='space-y-4 mt-10'>
					<div className='divider'>Pastes in this folder</div>
					{pastes.length === 0 ? (
						<p className='text-sm text-base-content/60'>
							No pastes in this folder yet.
						</p>
					) : (
						<ul className='flex flex-col gap-6'>
							{pastes.map((paste) => (
								<PasteCard key={paste.id} paste={paste} />
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	)
}
