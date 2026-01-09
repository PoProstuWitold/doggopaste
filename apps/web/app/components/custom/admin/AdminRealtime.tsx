'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FaBolt, FaDatabase, FaLink, FaSync, FaTrash } from 'react-icons/fa'
import { getBaseApiUrl, getContrastTextColor } from '@/app/utils/functions'

interface RealtimePaste {
	paste: {
		title: string
		slug: string
		content: string
		id: string
		createdAt: Date
		updatedAt: Date
	}
	syntax: {
		name: string
		extension: string
		color: string
	}
}

export const AdminRealtime: React.FC = () => {
	const [data, setData] = useState<RealtimePaste[]>([])
	const [total, setTotal] = useState<number>(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			setLoading(true)
			try {
				const res = await fetch(
					`${getBaseApiUrl()}/api/admin/pastes-realtime`,
					{
						credentials: 'include'
					}
				)
				const json = await res.json()
				if (!res.ok)
					throw new Error(json.error || `Failed ${res.status}`)
				if (!cancelled) {
					const arr: RealtimePaste[] = json.data?.realtimePastes || []
					setData(arr)
					setTotal(arr.length)
				}
			} catch (e) {
				if (!cancelled)
					setError(
						(e as Error).message || 'Failed to load realtime pastes'
					)
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
		fetch(`${getBaseApiUrl()}/api/admin/pastes-realtime`, {
			credentials: 'include'
		})
			.then(async (r) => {
				const j = await r.json()
				if (!r.ok) throw new Error(j.error || `Failed ${r.status}`)
				const arr: RealtimePaste[] = j.data?.realtimePastes || []
				setData(arr)
				setTotal(arr.length)
			})
			.catch((e) =>
				setError(e.message || 'Failed to reload realtime pastes')
			)
			.finally(() => setLoading(false))
	}

	return (
		<details className='collapse bg-base-200 collapse-arrow border border-base-300 rounded-lg'>
			<summary className='collapse-title text-xl font-medium'>
				<div className='flex items-center gap-3'>
					<span className='text-primary'>
						<FaBolt />
					</span>
					<p className='font-semibold tracking-wide'>
						Realtime Editors
					</p>
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
							<FaDatabase /> {total} total
						</span>
					)}
					<button
						type='button'
						onClick={reload}
						className='btn btn-sm flex items-center gap-1'
						disabled={loading}
					>
						<FaSync className={loading ? 'animate-spin' : ''} />{' '}
						Reload
					</button>
				</div>
			</summary>
			<div className='collapse-content pt-0'>
				{loading && (
					<p className='text-sm opacity-70'>
						Fetching realtime pastes...
					</p>
				)}
				{error && !loading && (
					<p className='text-error text-sm'>Error: {error}</p>
				)}
				{!loading &&
					!error &&
					(data.length ? (
						<div className='w-full overflow-x-auto -mx-2 px-2 pb-2 md:pb-0 relative'>
							<table className='table w-full min-w-[900px]'>
								<thead>
									<tr className='bg-base-300/60 backdrop-blur sticky top-0 z-10'>
										<th className='whitespace-nowrap'>
											ID
										</th>
										<th className='whitespace-nowrap'>
											Slug
										</th>
										<th className='whitespace-nowrap'>
											Title
										</th>
										<th className='whitespace-nowrap'>
											Syntax
										</th>
										<th className='whitespace-nowrap'>
											Updated
										</th>
										<th className='whitespace-nowrap'>
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{data.map((r) => (
										<RealtimeRow
											key={r.paste.id}
											realtimePaste={r}
											onAction={reload}
										/>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p>No realtime pastes found.</p>
					))}
			</div>
		</details>
	)
}

interface RealtimeRowProps {
	realtimePaste: RealtimePaste
	onAction?: () => void
}

const RealtimeRow: React.FC<RealtimeRowProps> = ({
	realtimePaste,
	onAction
}) => {
	const { paste, syntax } = realtimePaste
	const [working, setWorking] = useState(false)

	async function deletePaste() {
		if (!confirm('Delete this realtime paste?')) return
		setWorking(true)
		try {
			const res = await fetch(
				`${getBaseApiUrl()}/api/admin/pastes-realtime/${paste.id}`,
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
			<td className='font-mono truncate' title={paste.id}>
				{' '}
				{paste.id}{' '}
			</td>
			<td className='font-mono truncate' title={paste.slug}>
				{paste.slug ? (
					<Link
						prefetch={false}
						href={`/r/${paste.slug}`}
						className='inline-flex items-center gap-1 text-primary hover:underline'
						title={`Open realtime paste ${paste.slug}`}
					>
						<FaLink className='opacity-60' />
						<span className='truncate'>{paste.slug}</span>
					</Link>
				) : (
					<span className='opacity-50'>-</span>
				)}
			</td>
			<td className='truncate' title={paste.title}>
				<div className='flex items-center gap-1 truncate'>
					<FaBolt className='opacity-60 shrink-0' />
					<span className='truncate'>
						{paste.title || (
							<span className='italic opacity-70'>
								(no title)
							</span>
						)}
					</span>
				</div>
			</td>
			<td>
				<span
					className='badge mt-2 md:mt-0 font-semibold'
					style={{
						backgroundColor: syntax.color,
						color: getContrastTextColor(syntax.color)
					}}
				>
					{syntax.name}
				</span>
			</td>
			<td title={new Date(paste.updatedAt).toLocaleString('pl-PL')}>
				<div className='truncate'>
					{new Date(paste.updatedAt).toLocaleString('pl-PL')}
				</div>
			</td>
			<td className='space-x-2'>
				<button
					className='btn btn-sm btn-error flex items-center gap-1'
					disabled={working}
					onClick={deletePaste}
					title='Delete realtime paste'
					type='button'
				>
					<FaTrash className={working ? 'hidden' : ''} />
					{working && <FaSync className='animate-spin' />}
				</button>
			</td>
		</tr>
	)
}
