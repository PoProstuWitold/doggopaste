'use client'

import Link from 'next/link'
import { BsFiletypeRaw } from 'react-icons/bs'
import { FaCopy } from 'react-icons/fa6'
import { MdDownload } from 'react-icons/md'
import type { RealtimePaste } from '../types'
import { getBaseApiUrl } from '../utils/functions'

export const RealtimePasteButtons = ({
	realtimePaste
}: {
	realtimePaste: RealtimePaste
}) => {
	return (
		<div className='flex flex-wrap gap-2 justify-center'>
			<button type='button' className='btn btn-sm btn-primary'>
				<div className='flex items-center gap-1 font-extrabold'>
					Copy <FaCopy />
				</div>
			</button>
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
