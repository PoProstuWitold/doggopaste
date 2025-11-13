// app/u/[name]/folders/[id]/page.tsx
import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
	FaFolder,
	FaFolderOpen,
	FaHashtag,
	FaLongArrowAltLeft
} from 'react-icons/fa'
import { FolderCard } from '@/app/components/custom/FolderCard'
import { NewFolderCard } from '@/app/components/custom/NewFolderCard'
import type { Folder, User } from '@/app/types'
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

	// --- pobierz wszystkie foldery tylko dla właściciela ---
	let folders: Folder[] = []
	let currentFolder: Folder | undefined
	let childFolders: Folder[] = []

	if (isOwn) {
		const cookieHeader = await cookies()
		const foldersRes = await fetch(`${getBaseApiUrl()}/api/folders/all`, {
			headers: { Cookie: cookieHeader.toString() },
			next: { revalidate: 0 },
			cache: 'no-store'
		})

		if (foldersRes.ok) {
			const j = (await foldersRes.json()) as {
				success: boolean
				data: Folder[]
			}
			folders = j.data ?? []
		}

		// znajdź aktualny folder
		currentFolder = folders.find((f) => f.id === id)
		if (!currentFolder) {
			// folder nie należy do usera / nie istnieje
			notFound()
		}

		// bezpośrednie dzieci tego folderu
		childFolders = folders.filter((f) => f.parentFolderId === id)
	}

	return (
		<div className='mx-auto w-full p-5 space-y-10'>
			{/* back to profile */}
			<div>
				<Link
					href={`/u/${encodeURIComponent(foldersUser.name)}/folders`}
					className='inline-flex items-center gap-2 btn btn-link'
				>
					<FaLongArrowAltLeft className='w-5 h-5' />
					<span>Back to all folders</span>
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
				<span className='badge badge-ghost gap-1 font-mono p-5'>
					<FaHashtag className='w-5 h-5' />
					id: {id}
				</span>
			</header>

			<section className='grid gap-3 justify-start [grid-template-columns:repeat(auto-fit,minmax(8rem,max-content))]'>
				{isOwn && <NewFolderCard />}

				{isOwn &&
					childFolders.map((folder) => (
						<FolderCard
							key={folder.id}
							folder={folder}
							username={foldersUser.name}
						/>
					))}

				{isOwn && childFolders.length === 0 && (
					<p className='text-muted-foreground col-span-full my-2'>
						This folder has no subfolders yet.
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
