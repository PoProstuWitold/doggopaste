'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { BsFiletypeRaw } from 'react-icons/bs'
import { FaCheck, FaShare } from 'react-icons/fa'
import { FaCodeFork, FaLock } from 'react-icons/fa6'
import { MdDelete, MdDownload, MdEdit } from 'react-icons/md'
import type { Paste, User } from '../../types'
import { getBaseApiUrl } from '../../utils/functions'
import { CustomDialog } from '../core/CustomDialog'
import { CopyButton } from './CopyButton'

interface PasteButtonsProps {
	paste: Paste
	user: User | null
	decryptedContent?: string | null
	passwordInput?: string | null
	isLocked?: boolean
	content: string
}

export const PasteButtons = ({
	paste,
	user,
	decryptedContent,
	passwordInput,
	isLocked = false,
	content
}: PasteButtonsProps) => {
	const router = useRouter()
	const [clientBaseUrl, setClientBaseUrl] = useState<string | null>(null)
	const [shareLinkCopied, setShareLinkCopied] = useState(false)

	useEffect(() => {
		setClientBaseUrl(getBaseApiUrl())
	}, [])

	const copyLink = async () => {
		if (!clientBaseUrl) return
		try {
			await navigator.clipboard.writeText(
				`${clientBaseUrl}/p/${paste.slug}`
			)
			setShareLinkCopied(true)
			setTimeout(() => setShareLinkCopied(false), 2000)
		} catch {
			toast.error('Failed to copy link')
		}
	}

	const handleDownload = () => {
		if (!clientBaseUrl) return

		const extension = paste.syntax?.extension || 'txt'
		const fileName = `${paste.title || 'paste'}.${extension}`

		if (paste.encrypted) {
			if (!decryptedContent) {
				toast.error('Unlock content first to download.')
				return
			}
			try {
				const blob = new Blob([decryptedContent], {
					type: 'text/plain;charset=utf-8'
				})
				const url = window.URL.createObjectURL(blob)
				const link = document.createElement('a')
				link.href = url
				link.download = fileName
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				window.URL.revokeObjectURL(url)
				toast.success('Download started (decrypted)')
			} catch (error) {
				console.error('Download failed', error)
				toast.error('Failed to generate file')
			}
			return
		}

		let downloadUrl = `${clientBaseUrl}/api/pastes/${paste.slug}/download`

		if (paste.passwordHash && passwordInput) {
			downloadUrl += `?password=${encodeURIComponent(passwordInput)}`
		}

		window.location.href = downloadUrl
	}

	const handleRaw = () => {
		if (!clientBaseUrl) return

		if (paste.encrypted) {
			if (!decryptedContent) {
				toast.error('Unlock content first to view raw.')
				return
			}
			const blob = new Blob([decryptedContent], {
				type: 'text/plain;charset=utf-8'
			})
			const url = window.URL.createObjectURL(blob)
			window.open(url, '_blank')
			return
		}

		let rawUrl = `/p/${paste.slug}/raw`

		if (paste.passwordHash && passwordInput) {
			rawUrl += `?password=${encodeURIComponent(passwordInput)}`
		}

		window.open(rawUrl, '_blank')
	}

	const handleDeletePaste = async () => {
		try {
			const res = await fetch(
				`${getBaseApiUrl()}/api/pastes/${paste.slug}`,
				{ method: 'DELETE', credentials: 'include' }
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
			{!isLocked && <CopyButton text={content} />}

			<button
				type='button'
				onClick={copyLink}
				className='btn btn-sm btn-ghost btn-outline'
				title='Copy Share Link'
				disabled={!clientBaseUrl}
			>
				Share
				{shareLinkCopied ? <FaCheck /> : <FaShare />}
			</button>

			<button
				type='button'
				onClick={handleRaw}
				className='btn btn-sm btn-warning'
				disabled={isLocked || !clientBaseUrl}
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
				disabled={isLocked || !clientBaseUrl}
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

			{user?.id === paste.userId && (
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
