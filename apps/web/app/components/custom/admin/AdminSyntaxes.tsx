'use client'

import { useEffect, useState } from 'react'
import {
	FaCode,
	FaDatabase,
	FaEdit,
	FaSave,
	FaSync,
	FaTimes
} from 'react-icons/fa'
import { getBaseApiUrl } from '@/app/utils/functions'

interface AdminSyntax {
	id: string
	name: string
	extension: string
	color: string
}

interface AdminSyntaxesResponse {
	data?: { syntaxes: AdminSyntax[] }
	error?: string
}

export const AdminSyntaxes: React.FC = () => {
	const [syntaxes, setSyntaxes] = useState<AdminSyntax[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			setLoading(true)
			try {
				const res = await fetch(
					`${getBaseApiUrl()}/api/admin/syntaxes`,
					{ credentials: 'include' }
				)
				const json: AdminSyntaxesResponse = await res.json()
				if (!res.ok)
					throw new Error(json.error || `Failed ${res.status}`)
				if (!cancelled) setSyntaxes(json.data?.syntaxes || [])
			} catch (e) {
				if (!cancelled)
					setError((e as Error).message || 'Failed to load syntaxes')
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
		fetch(`${getBaseApiUrl()}/api/admin/syntaxes`, {
			credentials: 'include'
		})
			.then(async (r) => {
				const j: AdminSyntaxesResponse = await r.json()
				if (!r.ok) throw new Error(j.error || `Failed ${r.status}`)
				setSyntaxes(j.data?.syntaxes || [])
			})
			.catch((e) => setError(e.message || 'Failed to reload syntaxes'))
			.finally(() => setLoading(false))
	}

	return (
		<details className='collapse bg-base-200 collapse-arrow border border-base-300 rounded-lg'>
			<summary className='collapse-title text-xl font-medium'>
				<div className='flex items-center gap-3'>
					<span className='text-primary'>
						<FaCode />
					</span>
					<p className='font-semibold tracking-wide'>Syntaxes</p>
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
							<FaDatabase /> {syntaxes.length} total
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
					<p className='text-sm opacity-70'>Fetching syntaxes...</p>
				)}
				{error && !loading && (
					<p className='text-error text-sm'>Error: {error}</p>
				)}
				{!loading &&
					!error &&
					(syntaxes.length ? (
						<div className='w-full overflow-x-auto -mx-2 px-2 pb-2 md:pb-0'>
							<table className='table w-full min-w-[760px]'>
								<thead>
									<tr className='bg-base-300/60 backdrop-blur sticky top-0 z-10'>
										<th className='whitespace-nowrap'>
											ID
										</th>
										<th className='whitespace-nowrap'>
											Syntax
										</th>
										<th className='whitespace-nowrap'>
											Extension
										</th>
										<th className='whitespace-nowrap'>
											Color
										</th>
										<th className='whitespace-nowrap'>
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{syntaxes.map((s) => (
										<SyntaxRow
											key={s.id}
											syntax={s}
											onAction={reload}
										/>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p>No syntaxes found.</p>
					))}
			</div>
		</details>
	)
}

interface SyntaxRowProps {
	syntax: AdminSyntax
	onAction?: () => void
}

const SyntaxRow: React.FC<SyntaxRowProps> = ({ syntax, onAction }) => {
	const [editing, setEditing] = useState(false)
	const [working, setWorking] = useState(false)
	const [name, setName] = useState(syntax.name)
	const [extension, setExtension] = useState(syntax.extension)
	const [color, setColor] = useState(syntax.color)
	const [error, setError] = useState<string | null>(null)

	function startEdit() {
		setEditing(true)
		setError(null)
	}

	function cancelEdit() {
		setEditing(false)
		setName(syntax.name)
		setExtension(syntax.extension)
		setColor(syntax.color)
		setError(null)
	}

	async function saveEdit() {
		setWorking(true)
		setError(null)
		try {
			// Placeholder PUT endpoint
			await new Promise((res) => setTimeout(res, 600))
			// simulate success and refresh
			onAction?.()
			setEditing(false)
		} catch (e) {
			setError((e as Error).message || 'Update failed')
		} finally {
			setWorking(false)
		}
	}

	return (
		<tr className='hover:bg-base-300/40 transition-colors'>
			<td className='font-mono truncate' title={syntax.id}>
				{syntax.id}
			</td>
			<td className='truncate' title={syntax.name}>
				{editing ? (
					<input
						value={name}
						onChange={(e) => setName(e.target.value)}
						className='input input-xs input-bordered w-full max-w-[160px]'
						placeholder='Name'
					/>
				) : (
					<span className='truncate'>{syntax.name}</span>
				)}
			</td>
			<td className='truncate' title={syntax.extension}>
				{editing ? (
					<input
						value={extension}
						onChange={(e) => setExtension(e.target.value)}
						className='input input-xs input-bordered w-full max-w-[110px] font-mono'
						placeholder='.ext'
					/>
				) : syntax.extension ? (
					<span className='badge badge-soft font-mono font-semibold'>
						{syntax.extension}
					</span>
				) : (
					<span className='italic mx-2'>No extension</span>
				)}
			</td>
			<td className='truncate' title={syntax.color}>
				{editing ? (
					<div className='flex items-center gap-2'>
						<input
							type='text'
							value={color}
							onChange={(e) => setColor(e.target.value)}
							className='input input-xs input-bordered w-28 font-mono'
							placeholder='#abcdef'
						/>
						<span
							className='inline-block h-4 w-4 rounded-sm border border-base-300'
							style={{ backgroundColor: color }}
						></span>
					</div>
				) : (
					<div className='flex items-center gap-2 truncate'>
						<span
							className='inline-block h-4 w-4 rounded-sm border border-base-300'
							style={{ backgroundColor: syntax.color }}
						></span>
						<span className='font-mono truncate font-semibold'>
							{syntax.color}
						</span>
					</div>
				)}
			</td>
			<td className='space-x-2'>
				{editing ? (
					<div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3'>
						<button
							type='button'
							onClick={saveEdit}
							className='btn btn-xs btn-success flex items-center gap-1'
							disabled={working}
							title='Save syntax'
						>
							{working ? (
								<FaSync className='animate-spin' />
							) : (
								<FaSave />
							)}
							<span className='hidden sm:inline'>Save</span>
						</button>
						<button
							type='button'
							onClick={cancelEdit}
							className='btn btn-xs btn-ghost flex items-center gap-1'
							disabled={working}
							title='Cancel edit'
						>
							<FaTimes />
						</button>
						{error && (
							<span className='text-error text-xs'>{error}</span>
						)}
					</div>
				) : (
					<button
						type='button'
						onClick={startEdit}
						className='btn btn-xs btn-outline flex items-center gap-1'
						title='Edit syntax'
					>
						<FaEdit />
						<span className='hidden sm:inline'>Update</span>
					</button>
				)}
			</td>
		</tr>
	)
}
