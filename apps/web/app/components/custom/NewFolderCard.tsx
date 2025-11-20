'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { FaFolderPlus, FaSpinner } from 'react-icons/fa'
import { CustomDialog } from '@/app/components/core/CustomDialog'
import { getBaseApiUrl } from '@/app/utils/functions'

interface NewFolderCardProps {
	label?: string
	parentId?: string | null
}

export const NewFolderCard = ({
	label = 'New',
	parentId = null
}: NewFolderCardProps) => {
	const [name, setName] = useState('')
	const [loading, setLoading] = useState(false)

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault()
		const trimmed = name.trim()
		if (trimmed.length < 3) {
			toast.error('Folder name must be at least 3 characters')
			return
		}
		setLoading(true)
		try {
			const res = await fetch(`${getBaseApiUrl()}/api/folders`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: trimmed, parentId })
			})
			const json = await res.json()
			if (!res.ok) {
				const msg = json?.message || 'Failed to create folder'
				toast.error(msg)
			} else {
				toast.success('Folder created')
				window.location.reload()
			}
		} catch (_err) {
			toast.error('Network error while creating folder')
		} finally {
			setLoading(false)
		}
	}
	const Inner = (
		<>
			<div
				className='aspect-square rounded-xl border border-base-300 bg-base-100 shadow-sm
                     grid place-items-center transition
                     group-hover:shadow-md group-hover:border-base-300/80'
			>
				<FaFolderPlus className='h-30 w-30 lg:h-24 lg:w-24 text-warning/90 transition group-hover:scale-105' />
			</div>
			<div className='mt-2 w-full text-center text-sm truncate'>
				{label}
			</div>
		</>
	)

	return (
		<div className='select-none'>
			<CustomDialog
				btnContent={Inner}
				title='Create Folder'
				description='Provide a unique folder name for this level.'
				btnClasses='group block w-full cursor-pointer'
			>
				<form onSubmit={handleCreate} className='flex flex-col gap-3'>
					<input
						type='text'
						className='input input-bordered w-full'
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder='Folder name'
						minLength={3}
						maxLength={40}
						pattern='^[A-Za-z][A-Za-z0-9]*$'
						title='Start with a letter; only letters or digits'
						required
					/>
					<button
						type='submit'
						className='btn btn-primary btn-sm'
						disabled={loading}
					>
						{loading ? (
							<FaSpinner className='animate-spin' />
						) : (
							'Create'
						)}
					</button>
				</form>
			</CustomDialog>
		</div>
	)
}
