'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
	FaDatabase,
	FaEye,
	FaEyeSlash,
	FaFileAlt,
	FaFileCode,
	FaLink,
	FaSync,
	FaTrash,
	FaUser,
	FaUserSlash
} from 'react-icons/fa'
import { getBaseApiUrl, getContrastTextColor } from '@/app/utils/functions'

interface AdminPaste {
	paste: {
		id: string
		title: string
		slug: string
		visibility: 'public' | 'private' | 'unlisted'
		createdAt: Date
		updatedAt: Date
	}
	user: {
		id: string
		name: string
	}
	syntax: {
		id: string
		name: string
		extension: string
		color: string
	}
}

export const AdminPastes: React.FC = () => {
	const [data, setData] = useState<AdminPaste[]>([])
	const [total, setTotal] = useState<number>(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			setLoading(true)
			try {
				const res = await fetch(`${getBaseApiUrl()}/api/admin/pastes`, {
					credentials: 'include'
				})
				const json = await res.json()
				if (!res.ok) {
					throw new Error(json.error || `Failed ${res.status}`)
				}
				if (!cancelled) {
					setData(json.data?.pastes || [])
					setTotal(json.data?.total || json.data?.pastes.length || 0)
				}
			} catch (e) {
				if (!cancelled)
					setError((e as Error).message || 'Failed to load pastes')
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
		fetch(`${getBaseApiUrl()}/api/admin/pastes`, { credentials: 'include' })
			.then(async (r) => {
				const j = await r.json()
				if (!r.ok) throw new Error(j.error || `Failed ${r.status}`)
				setData(j.data?.pastes || [])
				setTotal(j.data?.total || j.data?.pastes.length || 0)
			})
			.catch((e) => setError(e.message || 'Failed to reload pastes'))
			.finally(() => setLoading(false))
	}

	return (
		<details className='collapse bg-base-200 collapse-arrow border border-base-300 rounded-lg'>
			<summary className='collapse-title text-xl font-medium'>
				<div className='flex items-center gap-3'>
					<span className='text-primary'>
						<FaFileCode />
					</span>
					<p className='font-semibold tracking-wide'>Static Pastes</p>
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
					<p className='text-sm opacity-70'>Fetching pastes...</p>
				)}
				{error && !loading && (
					<p className='text-error text-sm'>Error: {error}</p>
				)}
				{!loading &&
					!error &&
					(data.length ? (
						<div className='w-full overflow-x-auto -mx-2 px-2 pb-2 md:pb-0 relative'>
							<table className='table w-full min-w-[1040px]'>
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
											User
										</th>
										<th className='whitespace-nowrap'>
											Visibility
										</th>
										<th className='whitespace-nowrap'>
											Syntax
										</th>
										<th className='whitespace-nowrap'>
											Created
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
									{data.map((p) => (
										<PasteRow
											key={p.paste.id}
											staticPaste={p}
											onAction={reload}
										/>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p>No pastes found.</p>
					))}
			</div>
		</details>
	)
}

interface PasteRowProps {
	staticPaste: AdminPaste
	onAction?: () => void
}

const PasteRow: React.FC<PasteRowProps> = ({ staticPaste, onAction }) => {
	const { paste, syntax, user } = staticPaste
	const [working, setWorking] = useState(false)

	async function deletePaste() {
		if (!confirm('Delete this paste?')) return
		setWorking(true)
		try {
			const res = await fetch(
				`${getBaseApiUrl()}/api/pastes/${paste.id}`,
				{
					method: 'DELETE',
					credentials: 'include'
				}
			)
			if (!res.ok) throw new Error(`Failed ${res.status}`)
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
				{paste.id}
			</td>
			<td className='font-mono truncate' title={paste.slug}>
				{paste.slug ? (
					<Link
						prefetch={false}
						href={`/p/${paste.slug}`}
						className='inline-flex items-center gap-1 text-primary hover:underline'
						title={`Open paste ${paste.slug}`}
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
					<FaFileAlt className='opacity-60 shrink-0' />
					<span className='truncate'>
						{paste.title || (
							<span className='italic opacity-70'>
								(no title)
							</span>
						)}
					</span>
				</div>
			</td>
			<td className='truncate' title={user?.name ?? 'Guest Paste'}>
				{user ? (
					<div className='flex items-center gap-1 truncate'>
						<FaUser className='opacity-60 shrink-0' />
						<span className='truncate'>{user.name}</span>
					</div>
				) : (
					<span className='badge badge-neutral flex items-center gap-1'>
						<FaUserSlash /> Guest
					</span>
				)}
			</td>
			<td>
				{paste.visibility === 'public' ? (
					<span className='badge badge-success flex items-center gap-1'>
						<FaEye /> Public
					</span>
				) : paste.visibility === 'private' ? (
					<span className='badge badge-warning flex items-center gap-1'>
						<FaEyeSlash /> Private
					</span>
				) : paste.visibility === 'unlisted' ? (
					<span className='badge badge-info flex items-center gap-1'>
						<FaLink /> Unlisted
					</span>
				) : (
					<span className='badge'>{paste.visibility}</span>
				)}
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
			<td>
				<div className='truncate'>
					{new Date(paste.createdAt).toLocaleString('pl-PL')}
				</div>
			</td>
			<td>
				<div className='truncate'>
					{new Date(paste.updatedAt).toLocaleString('pl-PL')}
				</div>
			</td>
			<td className='space-x-2'>
				<button
					className='btn btn-sm btn-error flex items-center gap-1'
					disabled={working}
					onClick={deletePaste}
					title='Delete paste'
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
