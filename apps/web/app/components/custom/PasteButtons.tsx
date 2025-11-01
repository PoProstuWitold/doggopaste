'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { BsFiletypeRaw } from 'react-icons/bs'
import { FaCheck, FaShare } from 'react-icons/fa'
import { FaCodeFork } from 'react-icons/fa6'
import { ImEmbed2 } from 'react-icons/im'
import { MdDelete, MdDownload, MdEdit } from 'react-icons/md'
import type { Paste, User } from '../../types'
import { getBaseApiUrl } from '../../utils/functions'
import { CustomDialog } from '../core/CustomDialog'
import { CopyButton } from './CopyButton'

export const PasteButtons = ({
	paste,
	user
}: {
	paste: Paste
	user: User | null
}) => {
	const router = useRouter()

	const [clientBaseUrl, setClientBaseUrl] = useState<string | null>(null)
	const [shareLinkCopied, setShareLinkCopied] = useState(false)

	useEffect(() => {
		setClientBaseUrl(getBaseApiUrl())
	}, [])

	const copy = async () => {
		if (!clientBaseUrl) return
		try {
			await navigator.clipboard.writeText(
				`${clientBaseUrl}/p/${paste.slug}`
			)
		} catch {}
		setShareLinkCopied(true)
		setTimeout(() => setShareLinkCopied(false), 2000)
	}

	const handleDeletePaste = async () => {
		try {
			const res = await fetch(
				`${getBaseApiUrl()}/api/pastes/${paste.slug}`,
				{
					method: 'DELETE',
					credentials: 'include'
				}
			)
			const json = await res.json()

			if (res.ok) {
				toast.success(json.message || 'Paste deleted!')
				router.push('/')
				router.refresh()
			} else {
				toast.error(json.message || 'Failed to delete paste')
			}
		} catch (_err) {
			toast.error('Something went wrong while deleting')
		}
	}

	return (
		<div className='flex flex-wrap gap-2 justify-center'>
			<CopyButton text={paste.content} />
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
				href={`/p/${paste.slug}/raw`}
				className='btn btn-sm btn-warning'
			>
				<div className='flex items-center gap-1 font-extrabold'>
					Raw <BsFiletypeRaw />
				</div>
			</Link>
			{clientBaseUrl ? (
				<a
					href={`${clientBaseUrl}/api/pastes/${paste.slug}/download`}
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
			<button type='button' className='btn btn-sm btn-info'>
				<div className='flex items-center gap-1 font-extrabold'>
					Embed <ImEmbed2 />
				</div>
			</button>
			<Link
				href={`/p/${paste.slug}/fork`}
				className='btn btn-sm btn-secondary'
			>
				<div className='flex items-center gap-1 font-extrabold'>
					Fork <FaCodeFork />
				</div>
			</Link>
			{user?.id === paste.userId && (
				<>
					<Link
						href={`/p/${paste.slug}/edit`}
						className='btn btn-sm btn-accent'
					>
						<div className='flex items-center gap-1 font-extrabold'>
							Edit <MdEdit />
						</div>
					</Link>
					<CustomDialog
						btnContent={
							<div className='flex items-center gap-1 font-extrabold'>
								Delete <MdDelete />
							</div>
						}
						btnClasses='btn btn-sm btn-error'
						title='Delete this paste?'
						description='This action is irreversible. Are you sure you want to permanently delete this paste?'
					>
						<div className='flex justify-end gap-2'>
							<button
								className='btn btn-error'
								onClick={handleDeletePaste}
								type='button'
							>
								Delete
							</button>
						</div>
					</CustomDialog>
				</>
			)}
		</div>
	)
}
