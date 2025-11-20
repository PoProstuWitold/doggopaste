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
				<FaFolderPlus className='h-30 w-30 lg:h-24 lg:w-24 text-warning/90 transition group-hover:scale-105' />
			</div>
			<div className='mt-2 w-full text-center text-sm truncate'>
				{label}
			</div>
		</>
	)

	return (
		<div className='select-none'>
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
