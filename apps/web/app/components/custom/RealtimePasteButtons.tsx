'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { BsFiletypeRaw } from 'react-icons/bs'
import { FaCheck, FaShare } from 'react-icons/fa'
import { FaCodeFork } from 'react-icons/fa6'
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
	const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null)
	const [shareLinkCopied, setShareLinkCopied] = useState(false)

	useEffect(() => {
		setApiBaseUrl(getBaseApiUrl())
	}, [])

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(
				`${window.location.origin}/r/${realtimePaste.slug}`
			)
			setShareLinkCopied(true)
			setTimeout(() => setShareLinkCopied(false), 2000)
		} catch {
			toast.error('Failed to copy link')
		}
	}

	return (
		<div className='flex flex-wrap gap-2 justify-center'>
			<CopyButton text={content} />
			<button
				type='button'
				onClick={copy}
				className='btn btn-sm btn-ghost btn-outline'
				title='Share Link'
			>
				Share
				{shareLinkCopied ? <FaCheck /> : <FaShare />}
			</button>
			<Link
				href={`/r/${realtimePaste.slug}/raw`}
				className='btn btn-sm btn-warning'
			>
				<div className='flex items-center gap-1 font-extrabold'>
					Raw <BsFiletypeRaw />
				</div>
			</Link>
			{apiBaseUrl ? (
				<a
					href={`${apiBaseUrl}/api/pastes-realtime/${realtimePaste.slug}/download`}
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
			<Link
				href={`/p/${realtimePaste.slug}/fork?type=realtime`}
				className='btn btn-sm btn-secondary'
			>
				<div className='flex items-center gap-1 font-extrabold'>
					Fork <FaCodeFork />
				</div>
			</Link>
		</div>
	)
}
