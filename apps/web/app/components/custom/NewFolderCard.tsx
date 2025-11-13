'use client'

import type { MouseEventHandler } from 'react'
import { FaFolderPlus } from 'react-icons/fa'

interface NewFolderCardProps {
	onClick?: MouseEventHandler
	label?: string
}

export const NewFolderCard = ({
	onClick,
	label = 'New'
}: NewFolderCardProps) => {
	const Inner = (
		<>
			<div
				className='aspect-square rounded-xl border border-base-300 bg-base-100 shadow-sm
                     grid place-items-center transition
                     group-hover:shadow-md group-hover:border-base-300/80'
			>
				<FaFolderPlus className='h-20 w-20 text-warning/90 transition group-hover:scale-105' />
			</div>
			<div className='mt-2 w-full text-center text-sm truncate'>
				{label}
			</div>
		</>
	)

	return (
		<div className='w-full select-none max-w-36 max-h-36'>
			<button
				type='button'
				aria-label='Create new folder'
				onClick={onClick}
				className='group block w-full cursor-pointer'
			>
				{Inner}
			</button>
		</div>
	)
}
