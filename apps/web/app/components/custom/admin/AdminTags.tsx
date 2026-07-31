'use client'

import { useEffect, useState } from 'react'
import { FaHashtag, FaTags, FaTrash } from 'react-icons/fa'
import type { AdminTagDto, AdminTagsResponse } from '@/app/types'
import { apiRequest, getApiErrorMessage } from '@/app/utils/api'
import { AdminConfirmDialog } from './AdminConfirmDialog'
import { AdminSection } from './AdminSection'

async function getAdminTags(): Promise<AdminTagDto[]> {
	const result = await apiRequest<AdminTagsResponse>('/api/admin/tags')
	if (!result.ok) {
		throw new Error(
			getApiErrorMessage(result.data, `Failed ${result.status}`)
		)
	}

	return result.data?.data.tags ?? []
}

export const AdminTags: React.FC = () => {
	const [tags, setTags] = useState<AdminTagDto[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			setLoading(true)
			try {
				const nextTags = await getAdminTags()
				if (!cancelled) setTags(nextTags)
			} catch (e) {
				if (!cancelled)
					setError((e as Error).message || 'Failed to load tags')
			} finally {
				if (!cancelled) setLoading(false)
			}
		})()
		return () => {
			cancelled = true
		}
	}, [])

	async function reload() {
		setLoading(true)
		setError(null)
		try {
			setTags(await getAdminTags())
		} catch (e) {
			setError((e as Error).message || 'Failed to reload tags')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AdminSection
			id='admin-tags'
			title='Tags'
			description='Review the tags currently used to organize static pastes.'
			icon={<FaTags />}
			count={tags.length}
			loading={loading}
			error={error}
			loadingLabel='Fetching tags...'
			emptyTitle='No tags found'
			emptyDescription='There are no tags to display.'
			isEmpty={tags.length === 0}
			onReload={reload}
		>
			<div className='overflow-hidden rounded-xl border border-base-300 bg-base-100'>
				<table className='table block! w-full md:table! md:table-fixed'>
					<caption className='sr-only'>Paste tags</caption>
					<thead className='hidden bg-base-200/70 md:table-header-group'>
						<tr>
							<th scope='col' className='w-[45%]'>
								Name
							</th>
							<th scope='col' className='w-[40%]'>
								ID
							</th>
							<th scope='col' className='w-[15%] text-right'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='block divide-y divide-base-300 md:table-row-group'>
						{tags.map((tag) => (
							<TagRow key={tag.id} tag={tag} onAction={reload} />
						))}
					</tbody>
				</table>
			</div>
		</AdminSection>
	)
}

interface TagRowProps {
	tag: AdminTagDto
	onAction?: () => void
}

const TagRow: React.FC<TagRowProps> = ({ tag, onAction }) => {
	const [working, setWorking] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [confirmOpen, setConfirmOpen] = useState(false)

	async function deleteTag() {
		setWorking(true)
		setError(null)
		try {
			const result = await apiRequest(
				`/api/admin/tags/${encodeURIComponent(tag.id)}`,
				{ method: 'DELETE' }
			)

			if (!result.ok) {
				throw new Error(
					getApiErrorMessage(result.data, `Failed ${result.status}`)
				)
			}
			setConfirmOpen(false)
			onAction?.()
		} catch (e) {
			setError((e as Error).message || 'Delete failed')
		} finally {
			setWorking(false)
		}
	}

	return (
		<tr className='grid grid-cols-1 gap-4 p-4 transition-colors hover:bg-base-200/50 sm:grid-cols-2 md:table-row md:p-0'>
			<td className='block min-w-0 p-0 md:table-cell md:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 md:hidden'>
					Name
				</span>
				<span className='badge badge-accent h-auto max-w-full gap-1.5 py-1.5'>
					<FaHashtag aria-hidden='true' className='shrink-0' />
					<span className='min-w-0 break-all'>{tag.name}</span>
				</span>
			</td>
			<td className='block min-w-0 p-0 md:table-cell md:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 md:hidden'>
					ID
				</span>
				<span
					className='block break-all font-mono text-xs text-base-content/65'
					title={tag.id}
				>
					{tag.id}
				</span>
			</td>
			<td className='block min-w-0 p-0 sm:col-span-2 md:table-cell md:p-4 md:text-right'>
				<button
					type='button'
					className='btn btn-error btn-outline min-h-11 w-full gap-2 sm:w-auto md:btn-sm md:min-h-10'
					disabled={working}
					onClick={() => {
						setError(null)
						setConfirmOpen(true)
					}}
					aria-label={`Delete tag ${tag.name}`}
				>
					<FaTrash aria-hidden='true' />
					Delete
				</button>
				<AdminConfirmDialog
					open={confirmOpen}
					title='Delete tag?'
					description='This permanently deletes the selected tag. This action cannot be undone.'
					itemLabel={`#${tag.name}`}
					working={working}
					error={error}
					onClose={() => {
						setConfirmOpen(false)
						setError(null)
					}}
					onConfirm={deleteTag}
				/>
			</td>
		</tr>
	)
}
