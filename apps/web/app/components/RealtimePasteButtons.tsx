'use client'

import Link from 'next/link'
import { BsFiletypeRaw } from 'react-icons/bs'
import { MdDownload } from 'react-icons/md'
import type { RealtimePaste } from '../types'
import { getBaseApiUrl } from '../utils/functions'
import { CopyButton } from './CopyButton'

export const RealtimePasteButtons = ({
	realtimePaste,
	content
}: {
	realtimePaste: RealtimePaste
	content: string
}) => {
	return (
		<div className='flex flex-wrap gap-2 justify-center'>
			<CopyButton text={content} />
			<Link
				href={`/r/${realtimePaste.slug}/raw`}
				className='btn btn-sm btn-warning'
			>
				<div className='flex items-center gap-1 font-extrabold'>
					Raw <BsFiletypeRaw />
				</div>
			</Link>
			<a
				href={`${getBaseApiUrl()}/api/pastes-realtime/${realtimePaste?.slug}/download`}
				className='btn btn-sm btn-success'
			>
				<div className='flex items-center gap-1 font-extrabold'>
					Download <MdDownload />
				</div>
			</a>
		</div>
	)
}
