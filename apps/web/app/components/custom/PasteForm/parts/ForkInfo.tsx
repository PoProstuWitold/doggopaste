'use client'

import Link from 'next/link'
import { FaCodeBranch } from 'react-icons/fa'

export function ForkInfo({
	slug,
	type,
	title
}: {
	slug: string
	type?: 'realtime' | 'static'
	title?: string | null
}) {
	return (
		<div className='alert alert-info'>
			<FaCodeBranch className='w-5 h-5' />
			<span>
				Forked from{` `}
				{type === 'realtime' ? 'realtime paste' : 'static paste'}{' '}
				<Link
					target='_blank'
					className='link'
					href={`/${type === 'realtime' ? 'r' : 'p'}/${slug}`}
				>
					{title || slug}
				</Link>
				. You can edit anything before creating your fork.
			</span>
		</div>
	)
}
