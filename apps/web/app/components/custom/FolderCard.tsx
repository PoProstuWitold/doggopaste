'use client'

import Link from 'next/link'
import { FaFileAlt, FaFolder } from 'react-icons/fa'
import type { Folder } from '@/app/types'

interface FolderCardProps {
	folder: Folder
	username: string
}

export const FolderCard = ({ folder, username }: FolderCardProps) => {
	const pastes = folder.pastesCount ?? 0
	const subfolders = folder.subfoldersCount ?? 0

	return (
		<div className='select-none'>
			<Link
				href={`/u/${encodeURIComponent(username)}/folders/${folder.id}`}
				aria-label={`Open folder ${folder.name}`}
				className='group block'
			>
				<div
					className='aspect-square rounded-xl border border-base-300 bg-base-100 shadow-sm
                     grid place-items-center transition
                     group-hover:shadow-md group-hover:border-base-300/80'
				>
					<FaFolder className='h-30 w-30 lg:h-24 lg:w-24 text-warning/90 transition group-hover:scale-105' />
					<div className='flex items-center gap-1.5 sm:gap-2 ml-2'>
						<span
							className='badge badge-sm badge-ghost gap-1'
							title='Subfolder count'
						>
							<FaFolder className='w-3 h-3 opacity-70' />
							{subfolders}
						</span>

						<span
							className='badge badge-sm badge-ghost gap-1'
							title='Paste count'
						>
							<FaFileAlt className='w-3 h-3 opacity-70' />
							{pastes}
						</span>
					</div>
				</div>

				<div className='mt-2 w-full text-center text-sm truncate'>
					{folder.name}
				</div>
			</Link>
		</div>
	)
}
