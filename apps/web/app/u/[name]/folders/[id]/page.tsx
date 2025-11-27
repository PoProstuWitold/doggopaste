import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FaFolder, FaFolderOpen, FaLongArrowAltLeft } from 'react-icons/fa'
import { FolderButtons } from '@/app/components/custom/FolderButtons'
import { FolderCard } from '@/app/components/custom/FolderCard'
import { NewFolderCard } from '@/app/components/custom/NewFolderCard'
import { PasteCard } from '@/app/components/custom/PasteCard'
import type { Folder, Paste, User } from '@/app/types'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { getBaseApiUrl } from '@/app/utils/functions'

export const dynamic = 'force-dynamic'

type Params = {
	name: string
	id: string
}

async function fetchUserByName(name: string): Promise<User | null> {
	const res = await fetch(
		`${getBaseApiUrl()}/api/user/name/${encodeURIComponent(name)}`,
		{ next: { revalidate: 0 }, cache: 'no-store' }
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
	const { name, id } = await params
	const user = await fetchUserByName(name)
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
	const authClient = createDynamicAuthClient()
	const session = await authClient.getSession({
		fetchOptions: { headers: await headers() }
	})
	const loggedUser = session.data?.user
	const foldersUser = await fetchUserByName(name)
	if (!foldersUser) notFound()

	const isOwn = loggedUser && loggedUser.id === foldersUser.id

	let folders: Folder[] = []
	let currentFolder: Folder | undefined
	let childFolders: Folder[] = []
	let pastes: Paste[] = []

	if (isOwn) {
		const cookieHeader = await cookies()
		const folderRes = await fetch(
			`${getBaseApiUrl()}/api/folders/f/${encodeURIComponent(id)}`,
			{
				headers: { Cookie: cookieHeader.toString() },
				next: { revalidate: 0 },
				cache: 'no-store'
			}
		)

		if (!folderRes.ok) {
			if (folderRes.status === 404) notFound()
			throw new Error('Failed to load folder')
		}
		const folderJson = (await folderRes.json()) as {
			success: boolean
			data: { folder: Folder; pastes: Paste[] }
		}
		currentFolder = folderJson.data.folder
		pastes = folderJson.data.pastes || []

		const allRes = await fetch(`${getBaseApiUrl()}/api/folders/all`, {
			headers: { Cookie: cookieHeader.toString() },
			next: { revalidate: 0 },
			cache: 'no-store'
		})
		if (allRes.ok) {
			const allJson = (await allRes.json()) as {
				success: boolean
				data: Folder[]
			}
			folders = allJson.data || []
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
