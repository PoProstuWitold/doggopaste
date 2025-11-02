'use client'

import { FaCodeBranch, FaFileCode } from 'react-icons/fa'

export function Header({
	mode,
	type,
	slug,
	pasteSlug
}: {
	mode: 'create' | 'edit' | 'fork'
	type?: 'realtime' | 'static'
	slug?: string
	pasteSlug?: string
}) {
	return (
		<div className='flex flex-row items-center text-3xl font-bold text-center gap-4 justify-center'>
			{mode === 'fork' ? (
				<>
					<FaCodeBranch className='w-10 h-10' />
					{type === 'realtime'
						? `Fork Realtime Paste "${pasteSlug}"`
						: `Fork Static Paste "${pasteSlug}"`}
				</>
			) : (
				<>
					<FaFileCode className='w-10 h-10' />
					{mode === 'create'
						? 'Create New Static Paste'
						: `Edit Static Paste "${slug}"`}
				</>
			)}
		</div>
	)
}
