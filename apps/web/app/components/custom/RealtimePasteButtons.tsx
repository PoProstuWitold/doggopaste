'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BsFiletypeRaw } from 'react-icons/bs'
import { FaCheck, FaShare } from 'react-icons/fa'
import { MdDownload } from 'react-icons/md'
import type { RealtimePaste } from '../../types'
import { getBaseApiUrl } from '../../utils/functions'
import { CopyButton } from './CopyButton'

export const RealtimePasteButtons = ({
	realtimePaste,
	content
}: {
	realtimePaste: RealtimePaste
	content: string
}) => {
	const [clientBaseUrl, setClientBaseUrl] = useState<string | null>(null)
	const [shareLinkCopied, setShareLinkCopied] = useState(false)

	useEffect(() => {
		setClientBaseUrl(getBaseApiUrl())
	}, [])

	const copy = async () => {
		if (!clientBaseUrl) return
		try {
			await navigator.clipboard.writeText(
				`${clientBaseUrl}/r/${realtimePaste.slug}`
			)
		} catch {}
		setShareLinkCopied(true)
		setTimeout(() => setShareLinkCopied(false), 2000)
	}

	return (
		<div className='flex flex-wrap gap-2 justify-center'>
			<CopyButton text={content} />
			{clientBaseUrl ? (
				<button
					type='button'
					onClick={copy}
					className='btn btn-sm btn-ghost btn-outline'
					title='Share Link'
				>
					Share
					{shareLinkCopied ? <FaCheck /> : <FaShare />}
				</button>
			) : (
				<button
					type='button'
					className='btn btn-sm btn-ghost btn-outline'
					title='Share Link'
				>
					Share <FaShare />
				</button>
			)}
			<Link
				href={`/r/${realtimePaste.slug}/raw`}
				className='btn btn-sm btn-warning'
			>
				<div className='flex items-center gap-1 font-extrabold'>
					Raw <BsFiletypeRaw />
				</div>
			</Link>
			{clientBaseUrl ? (
				<a
					href={`${clientBaseUrl}/api/pastes-realtime/${realtimePaste.slug}/download`}
					className='btn btn-sm btn-success'
				>
					<div className='flex items-center gap-1 font-extrabold'>
						Download <MdDownload />
					</div>
				</a>
			) : (
				<span className='btn btn-sm btn-success'>
					<div className='flex items-center gap-1 font-extrabold'>
						Download <MdDownload />
					</div>
				</span>
			)}
		</div>
	)
}
