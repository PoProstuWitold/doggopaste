'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { FaFileCode, FaSpinner } from 'react-icons/fa'
import { FaPenToSquare, FaTrash } from 'react-icons/fa6'
import { CustomDialog } from '@/app/components/core/CustomDialog'
import { getBaseApiUrl } from '@/app/utils/functions'

interface FolderButtonsProps {
	folderId: string
	currentName: string
	name: string
}

export const FolderButtons = ({
	folderId,
	currentName,
	name
}: FolderButtonsProps) => {
	const router = useRouter()
	const [renameLoading, setRenameLoading] = useState(false)
	const [deleteLoading, setDeleteLoading] = useState(false)
	const [newName, setNewName] = useState(currentName)

	async function handleRename(e: React.FormEvent) {
		e.preventDefault()
		if (!newName || newName.length < 3) {
			toast.error('Name must be at least 3 characters')
			return
		}
		setRenameLoading(true)
		try {
			const res = await fetch(
				`${getBaseApiUrl()}/api/folders/${encodeURIComponent(folderId)}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newName })
				}
			)
			const json = await res.json()
			if (!res.ok) {
				const msg =
					json?.details?.[0]?.name ||
					json?.message ||
					'Failed to rename folder'
				toast.error(msg)
			} else {
				toast.success('Folder renamed')
				window.location.reload()
			}
		} catch (_err) {
			toast.error('Network error while renaming')
		} finally {
			setRenameLoading(false)
		}
	}

	async function handleDelete() {
		setDeleteLoading(true)
		try {
			const res = await fetch(
				`${getBaseApiUrl()}/api/folders/${encodeURIComponent(folderId)}`,
				{
					method: 'DELETE'
				}
			)
			const json = await res.json().catch(() => null)
			if (!res.ok) {
				const msg = json?.message || 'Failed to delete folder'
				toast.error(msg)
			} else {
				toast.success('Folder deleted')
				router.push(`/u/${encodeURIComponent(name)}/folders`)
			}
		} catch (_err) {
			toast.error('Network error while deleting')
		} finally {
			setDeleteLoading(false)
		}
	}

	return (
		<div className='flex flex-wrap gap-3 my-1'>
			<Link href='/p/create' className='btn btn-sm'>
				<span className='inline-flex items-center gap-2'>
					<FaFileCode /> Create Paste
				</span>
			</Link>
			<CustomDialog
				btnContent={
					<span className='inline-flex items-center gap-2'>
						<FaPenToSquare /> Rename
					</span>
				}
				title='Rename Folder'
				description={`Current name: ${currentName}`}
				btnClasses='btn btn-secondary btn-sm'
			>
				<form onSubmit={handleRename} className='flex flex-col gap-3'>
					<input
						type='text'
						className='input input-bordered w-full'
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder='New folder name'
						minLength={3}
						maxLength={40}
					/>
					<button
						type='submit'
						className='btn btn-primary btn-sm'
						disabled={renameLoading}
					>
						{renameLoading ? (
							<FaSpinner className='animate-spin' />
						) : (
							'Save'
						)}
					</button>
				</form>
			</CustomDialog>
			<CustomDialog
				btnContent={
					<span className='inline-flex items-center gap-2 text-error'>
						<FaTrash /> Delete
					</span>
				}
				title='Delete Folder'
				description='This action cannot be undone. All nested folders will be deleted. Your pastes will be preserved.'
				btnClasses='btn btn-error btn-soft btn-sm'
			>
				<div className='space-y-4'>
					<p>Are you sure you want to delete this folder?</p>
					<button
						type='button'
						onClick={handleDelete}
						className='btn btn-error btn-sm'
						disabled={deleteLoading}
					>
						{deleteLoading ? (
							<FaSpinner className='animate-spin' />
						) : (
							'Yes, I want to delete this folder'
						)}
					</button>
				</div>
			</CustomDialog>
		</div>
	)
}
