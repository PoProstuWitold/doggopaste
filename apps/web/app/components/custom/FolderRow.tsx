'use client'
import Link from 'next/link'
import type * as React from 'react'
import {
	FaChevronRight,
	FaExternalLinkAlt,
	FaFileAlt,
	FaFolder
} from 'react-icons/fa'
import type { Folder } from '@/app/types'

type FolderRowProps = {
	folder: Folder
	username: string
	children?: React.ReactNode
}

export function FolderRow({ folder, username, children }: FolderRowProps) {
	const href = `/u/${username}/folders/${folder.id}`

	return (
		<details
			className={['group', '[&[open]>summary_.chev]:rotate-90'].join(' ')}
		>
			<summary
				className={[
					'flex items-center gap-2 cursor-pointer select-none',
					'rounded-lg px-2 py-1.5',
					'hover:bg-base-200/70 transition-colors',
					'[-webkit-tap-highlight-color:transparent]'
				].join(' ')}
			>
				<span className='transition-transform duration-200 chev'>
					<FaChevronRight className='w-3.5 h-3.5 opacity-70' />
				</span>

				<FaFolder className='w-4.5 h-4.5 text-warning/90' />
				<span className='font-medium truncate'>{folder.name}</span>

				<div className='flex items-center gap-1.5 sm:gap-2 ml-2'>
					<span
						className='badge badge-sm badge-ghost gap-1'
						title='Subfolder count'
					>
						<FaFolder className='w-3 h-3 opacity-70' />
						{folder.subfoldersCount}
					</span>

					<span
						className='badge badge-sm badge-ghost gap-1'
						title='Paste count'
					>
						<FaFileAlt className='w-3 h-3 opacity-70' />
						{folder.pastesCount}
					</span>
				</div>

				<div className='ml-auto flex items-center gap-1 sm:gap-1.5 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity'>
					<Link
						href={href}
						title='Go to Folder'
						aria-label='Go to Folder'
						className='btn btn-xs gap-1 px-2'
					>
						<FaExternalLinkAlt className='w-3 h-3' />
						<span className='hidden sm:inline'>Open</span>
					</Link>
				</div>
			</summary>

			{children ? <div className='mt-1'>{children}</div> : null}
		</details>
	)
}
