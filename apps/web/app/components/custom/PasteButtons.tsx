'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { BsFiletypeRaw } from 'react-icons/bs'
import { FaCheck, FaShare } from 'react-icons/fa'
import { FaCodeFork, FaLock } from 'react-icons/fa6'
import { MdDelete, MdDownload, MdEdit } from 'react-icons/md'
import type { ApiMessageResponse, Paste, ViewerDto } from '../../types'
import { apiRequest, getApiErrorMessage } from '../../utils/api'
import { getBaseApiUrl } from '../../utils/functions'
import { CustomDialog } from '../core/CustomDialog'
import { CopyButton } from './CopyButton'

interface PasteButtonsProps {
	paste: Paste
	viewer: ViewerDto | null
	isLocked?: boolean
	content: string
}

export const PasteButtons = ({
	paste,
	viewer,
	isLocked = false,
	content
}: PasteButtonsProps) => {
	const router = useRouter()
	const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null)
	const [shareLinkCopied, setShareLinkCopied] = useState(false)
	const usesLocalContent =
		paste.passwordProtected ||
		paste.encrypted ||
		paste.expiration === 'burn_after_read'

	useEffect(() => {
		setApiBaseUrl(getBaseApiUrl())
	}, [])

	const copyLink = async () => {
		try {
			await navigator.clipboard.writeText(
				`${window.location.origin}/p/${paste.slug}`
			)
			setShareLinkCopied(true)
			setTimeout(() => setShareLinkCopied(false), 2000)
		} catch {
			toast.error('Failed to copy link')
		}
	}

	const handleDownload = () => {
		const extension = paste.syntax?.extension || 'txt'
		const sanitizedTitle = paste.title
			.replace(/[^\w\s.-]/g, '')
			.trim()
			.replace(/\s+/g, '_')
			.slice(0, 100)
			.replace(/^\.+|\.+$/g, '')
		const safeTitle = sanitizedTitle || 'paste'
		const fileName = `${safeTitle}.${extension}`

		if (usesLocalContent) {
			try {
				const blob = new Blob([content], {
					type: 'text/plain;charset=utf-8'
				})
				const url = window.URL.createObjectURL(blob)
				window.setTimeout(() => window.URL.revokeObjectURL(url), 500)
				const link = document.createElement('a')
				link.href = url
				link.download = fileName
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				toast.success('Download started')
			} catch (error) {
				console.error('Download failed', error)
				toast.error('Failed to generate file')
			}
			return
		}

		if (!apiBaseUrl) return

		window.location.href = `${apiBaseUrl}/api/pastes/${paste.slug}/download`
	}

	const handleRaw = () => {
		if (usesLocalContent) {
			const blob = new Blob([content], {
				type: 'text/plain;charset=utf-8'
			})
			const url = window.URL.createObjectURL(blob)
			const revokeTimeout = window.setTimeout(
				() => window.URL.revokeObjectURL(url),
				60_000
			)
			const rawWindow = window.open(url, '_blank')

			if (!rawWindow) {
				window.clearTimeout(revokeTimeout)
				window.URL.revokeObjectURL(url)
				toast.error('Allow pop-ups to view raw content.')
				return
			}

			rawWindow.opener = null
			return
		}

		window.open(`/p/${paste.slug}/raw`, '_blank')
	}

	const handleDeletePaste = async () => {
		try {
			const result = await apiRequest<ApiMessageResponse>(
				`/api/pastes/${encodeURIComponent(paste.slug)}`,
				{ method: 'DELETE' }
			)

			if (result.ok) {
				toast.success(result.data?.message || 'Paste deleted!')
				router.push('/')
				router.refresh()
			} else {
				toast.error(
					getApiErrorMessage(result.data, 'Failed to delete paste')
				)
			}
		} catch (_err) {
			toast.error('Something went wrong while deleting')
		}
	}

	return (
		<div className='flex flex-wrap gap-2 justify-center'>
			{!isLocked && <CopyButton text={content} />}

			<button
				type='button'
				onClick={copyLink}
				className='btn btn-sm btn-ghost btn-outline'
				title='Copy Share Link'
			>
				Share
				{shareLinkCopied ? <FaCheck /> : <FaShare />}
			</button>

			<button
				type='button'
				onClick={handleRaw}
				className='btn btn-sm btn-warning'
				disabled={isLocked}
				title={isLocked ? 'Unlock to view raw' : 'View Raw'}
			>
				<div className='flex items-center gap-1 font-extrabold'>
					Raw{' '}
					{isLocked ? (
						<FaLock className='w-3 h-3' />
					) : (
						<BsFiletypeRaw />
					)}
				</div>
			</button>

			<button
				type='button'
				onClick={handleDownload}
				className='btn btn-sm btn-success'
				disabled={isLocked || (!usesLocalContent && !apiBaseUrl)}
				title={isLocked ? 'Unlock to download' : 'Download File'}
			>
				<div className='flex items-center gap-1 font-extrabold'>
					Download{' '}
					{isLocked ? <FaLock className='w-3 h-3' /> : <MdDownload />}
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

			{viewer?.id === paste.userId && (
				<>
					<Link
						href={`/p/${paste.slug}/edit`}
						className='btn btn-sm btn-accent'
						type='button'
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
