'use client'

import { useEffect, useState } from 'react'
import { FaDatabase, FaSync, FaTags, FaTrash } from 'react-icons/fa'
import { getBaseApiUrl } from '@/app/utils/functions'

interface AdminTag {
	id: string
	name: string
}

interface AdminTagsResponse {
	data?: { tags: AdminTag[] }
	error?: string
}

export const AdminTags: React.FC = () => {
	const [tags, setTags] = useState<AdminTag[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			setLoading(true)
			try {
				const res = await fetch(`${getBaseApiUrl()}/api/admin/tags`, {
					credentials: 'include'
				})
				const json: AdminTagsResponse = await res.json()
				if (!res.ok)
					throw new Error(json.error || `Failed ${res.status}`)
				if (!cancelled) setTags(json.data?.tags || [])
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

	function reload() {
		setLoading(true)
		setError(null)
		fetch(`${getBaseApiUrl()}/api/admin/tags`, { credentials: 'include' })
			.then(async (r) => {
				const j: AdminTagsResponse = await r.json()
				if (!r.ok) throw new Error(j.error || `Failed ${r.status}`)
				setTags(j.data?.tags || [])
			})
			.catch((e) => setError(e.message || 'Failed to reload tags'))
			.finally(() => setLoading(false))
	}

	return (
		<details className='collapse bg-base-200 collapse-arrow border border-base-300 rounded-lg'>
			<summary className='collapse-title text-xl font-medium'>
				<div className='flex items-center gap-3'>
					<span className='text-primary'>
						<FaTags />
					</span>
					<p className='font-semibold tracking-wide'>Tags</p>
					{loading && (
						<span className='badge badge-outline animate-pulse'>
							Loading...
						</span>
					)}
					{error && !loading && (
						<span className='badge badge-error'>{error}</span>
					)}
					{!loading && !error && (
						<span className='badge badge-accent flex items-center gap-1'>
							<FaDatabase /> {tags.length} total
						</span>
					)}
					<button
						className='btn btn-sm flex items-center gap-1'
						onClick={reload}
						disabled={loading}
						type='button'
					>
						<FaSync className={loading ? 'animate-spin' : ''} />{' '}
						Reload
					</button>
				</div>
			</summary>
			<div className='collapse-content pt-0'>
				{loading && (
					<p className='text-sm opacity-70'>Fetching tags...</p>
				)}
				{error && !loading && (
					<p className='text-error text-sm'>Error: {error}</p>
				)}
				{!loading &&
					!error &&
					(tags.length ? (
						<div className='w-full overflow-x-auto -mx-2 px-2 pb-2 md:pb-0'>
							<table className='table w-full min-w-[520px]'>
								<thead>
									<tr className='bg-base-300/60 backdrop-blur sticky top-0 z-10'>
										<th className='whitespace-nowrap'>
											ID
										</th>
										<th className='whitespace-nowrap'>
											Name
										</th>
										<th className='whitespace-nowrap'>
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{tags.map((t) => (
										<TagRow
											key={t.id}
											tag={t}
											onAction={reload}
										/>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p>No tags found.</p>
					))}
			</div>
		</details>
	)
}

interface TagRowProps {
	tag: AdminTag
	onAction?: () => void
}

const TagRow: React.FC<TagRowProps> = ({ tag, onAction }) => {
	const [working, setWorking] = useState(false)

	async function deleteTag() {
		if (!confirm('Delete this tag?')) return
		setWorking(true)
		try {
			const res = await fetch(
				`${getBaseApiUrl()}/api/admin/tags/${tag.id}`,
				{
					method: 'DELETE',
					credentials: 'include'
				}
			)

			if (!res.ok) {
				const json = await res.json()
				throw new Error(json.message || `Failed ${res.status}`)
			}
			onAction?.()
		} catch (e) {
			alert((e as Error).message || 'Delete failed')
		} finally {
			setWorking(false)
		}
	}

	return (
		<tr className='hover:bg-base-300/40 transition-colors'>
			<td className='font-mono truncate' title={tag.id}>
				<div className='flex items-center gap-1 truncate'>
					<span className='truncate'>{tag.id}</span>
				</div>
			</td>
			<td className='truncate' title={tag.name}>
				<div className='flex flex-wrap gap-2 mt-2'>
					<span className='badge badge-accent'>#{tag.name}</span>
				</div>
			</td>
			<td className='space-x-2'>
				<button
					className='btn btn-sm btn-error flex items-center gap-1'
					disabled={working}
					onClick={deleteTag}
					title='Delete tag'
					type='button'
				>
					{working ? (
						<FaSync className='animate-spin' />
					) : (
						<FaTrash />
					)}
				</button>
			</td>
		</tr>
	)
}
