'use client'

import { useEffect, useState } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import toast from 'react-hot-toast'
import type {
	ApiDataResponse,
	Folder,
	FolderDto,
	PasteForm as PasteFormType
} from '@/app/types'
import { apiRequest, getApiErrorMessage } from '@/app/utils/api'
import { buildFolderTree, flattenWithIndent } from '@/app/utils/folderHelpers'

function withFolderCounts(folder: FolderDto): Folder {
	const counts = folder as Partial<
		Pick<Folder, 'subfoldersCount' | 'pastesCount'>
	>

	return {
		...folder,
		subfoldersCount: counts.subfoldersCount ?? 0,
		pastesCount: counts.pastesCount ?? 0
	}
}

export function FolderSelector() {
	const { control, setValue } = useFormContext<PasteFormType>()
	// Fully controlled field with explicit default.
	const { field: folderField } = useController<PasteFormType>({
		name: 'folder',
		control,
		defaultValue: 'none'
	})
	const selectedFolderId = (folderField.value as string) || 'none'

	const [folders, setFolders] = useState<Folder[]>([])
	const [foldersLoading, setFoldersLoading] = useState(false)
	const [foldersError, setFoldersError] = useState<string | null>(null)
	const [newFolderName, setNewFolderName] = useState('')
	const [createInsideSelected, setCreateInsideSelected] = useState(false)
	const [creatingFolder, setCreatingFolder] = useState(false)

	useEffect(() => {
		let alive = true
		const load = async () => {
			setFoldersLoading(true)
			setFoldersError(null)
			try {
				const result =
					await apiRequest<ApiDataResponse<Folder[]>>(
						'/api/folders/all'
					)
				if (!result.ok) {
					throw new Error(
						getApiErrorMessage(
							result.data,
							`Failed to load folders (${result.status})`
						)
					)
				}
				if (alive) setFolders(result.data?.data ?? [])
				// biome-ignore lint: no need to narrow
			} catch (e: any) {
				if (alive)
					setFoldersError(e?.message ?? 'Failed to load folders')
			} finally {
				if (alive) setFoldersLoading(false)
			}
		}
		load()
		return () => {
			alive = false
		}
	}, [])

	async function handleCreateFolderInline(): Promise<void> {
		const name = newFolderName.trim()
		if (!name) {
			toast.error('Folder name is required')
			return
		}
		if (name.length > 512) {
			toast.error('Folder name is too long (max 512)')
			return
		}

		setCreatingFolder(true)
		try {
			const parentId =
				createInsideSelected &&
				selectedFolderId &&
				selectedFolderId !== 'none'
					? selectedFolderId
					: null

			const result = await apiRequest<ApiDataResponse<FolderDto>>(
				'/api/folders',
				{
					method: 'POST',
					json: { name, parentId }
				}
			)

			console.debug(
				'[FolderSelector] create folder response:',
				result.data
			)
			if (!result.ok || !result.data?.data) {
				toast.error(
					getApiErrorMessage(result.data, 'Failed to create folder')
				)
				return
			}
			const created = withFolderCounts(result.data.data)
			if (!created.id) {
				toast.error('API did not return folder id')
				return
			}
			setFolders((prev) => {
				const withoutDup = prev.filter((f) => f.id !== created.id)
				return [...withoutDup, created]
			})
			// Select new folder via RHF + controller.
			setValue('folder', created.id, { shouldValidate: true })
			folderField.onChange(created.id)

			// Refresh full list (not blocking selection).
			;(async () => {
				try {
					const allResult =
						await apiRequest<ApiDataResponse<FolderDto[]>>(
							'/api/folders/all'
						)
					if (allResult.ok) {
						const normalized = (allResult.data?.data ?? []).map(
							withFolderCounts
						)
						console.debug(
							'[FolderSelector] refreshed folders:',
							normalized.length
						)
						setFolders((prev) => {
							const haveCreated = normalized.some(
								(f) => f.id === created.id
							)
							return haveCreated ? normalized : prev
						})
						// Reassert selection if race occurred.
						if (folderField.value !== created.id) {
							setValue('folder', created.id)
							folderField.onChange(created.id)
						}
					}
				} catch (e) {
					console.warn('[FolderSelector] refresh failed:', e)
				}
			})()
			setNewFolderName('')
			toast.success('Folder created')
			// biome-ignore lint: no need to narrow
		} catch (e: any) {
			toast.error(e?.message || 'Failed to create folder')
		} finally {
			setCreatingFolder(false)
		}
	}

	return (
		<label className='form-control w-full'>
			<div className='label'>
				<span className='label-text'>Folder</span>
			</div>

			<select
				ref={folderField.ref}
				name={folderField.name}
				value={selectedFolderId}
				onChange={(e) => folderField.onChange(e.target.value)}
				className='select select-bordered w-full'
				disabled={foldersLoading}
			>
				<option value='none'>No Folder Selected</option>
				{foldersError && (
					<option value='__error' disabled>
						Failed to load folders
					</option>
				)}
				{!foldersError &&
					selectedFolderId !== 'none' &&
					!folders.some((f) => f.id === selectedFolderId) && (
						<option value={selectedFolderId}>
							Loading folder…
						</option>
					)}
				{!foldersError &&
					(() => {
						const byParent = buildFolderTree(folders)
						const flat = flattenWithIndent(byParent, null)
						return flat.map(({ id, label }) => (
							<option key={id} value={id}>
								{label}
							</option>
						))
					})()}
			</select>

			{/* Inline folder creator */}
			<div className='mt-2 flex flex-col gap-2'>
				<div className='join w-full'>
					<input
						type='text'
						className='input input-bordered join-item w-full'
						placeholder='New folder name'
						value={newFolderName}
						onChange={(e) => setNewFolderName(e.target.value)}
						maxLength={512}
					/>
					<button
						type='button'
						className={`btn btn-primary join-item ${creatingFolder ? 'btn-disabled' : ''}`}
						onClick={handleCreateFolderInline}
						disabled={creatingFolder}
					>
						{creatingFolder ? 'Creating…' : 'Add'}
					</button>
				</div>

				<label className='flex items-center gap-2 text-sm'>
					<input
						type='checkbox'
						className='checkbox'
						checked={createInsideSelected}
						onChange={(e) =>
							setCreateInsideSelected(e.target.checked)
						}
					/>
					<span>Create inside the currently selected folder</span>
				</label>
			</div>
		</label>
	)
}
