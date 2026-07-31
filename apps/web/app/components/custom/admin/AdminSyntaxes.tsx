'use client'

import { useEffect, useState } from 'react'
import { FaCode, FaEdit, FaSave, FaTimes } from 'react-icons/fa'
import { FaRotate } from 'react-icons/fa6'
import type { AdminSyntaxDto, AdminSyntaxesResponse } from '@/app/types'
import { apiRequest, getApiErrorMessage } from '@/app/utils/api'
import { AdminSection } from './AdminSection'

async function getAdminSyntaxes(): Promise<AdminSyntaxDto[]> {
	const result = await apiRequest<AdminSyntaxesResponse>(
		'/api/admin/syntaxes'
	)
	if (!result.ok) {
		throw new Error(
			getApiErrorMessage(result.data, `Failed ${result.status}`)
		)
	}

	return result.data?.data.syntaxes ?? []
}

export const AdminSyntaxes: React.FC = () => {
	const [syntaxes, setSyntaxes] = useState<AdminSyntaxDto[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			setLoading(true)
			try {
				const nextSyntaxes = await getAdminSyntaxes()
				if (!cancelled) setSyntaxes(nextSyntaxes)
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

	async function reload() {
		setLoading(true)
		setError(null)
		try {
			setSyntaxes(await getAdminSyntaxes())
		} catch (e) {
			setError((e as Error).message || 'Failed to reload syntaxes')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AdminSection
			id='admin-syntaxes'
			title='Syntaxes'
			description='Maintain syntax names, file extensions and highlighting colors.'
			icon={<FaCode />}
			count={syntaxes.length}
			loading={loading}
			error={error}
			loadingLabel='Fetching syntaxes...'
			emptyTitle='No syntaxes found'
			emptyDescription='There are no syntax definitions to display.'
			isEmpty={syntaxes.length === 0}
			onReload={reload}
		>
			<div className='overflow-hidden rounded-xl border border-base-300 bg-base-100'>
				<table className='table block! w-full lg:table! lg:table-fixed'>
					<caption className='sr-only'>Syntax definitions</caption>
					<thead className='hidden bg-base-200/70 lg:table-header-group'>
						<tr>
							<th scope='col' className='w-[22%]'>
								Syntax
							</th>
							<th scope='col' className='w-[16%]'>
								Extension
							</th>
							<th scope='col' className='w-[20%]'>
								Color
							</th>
							<th scope='col' className='w-[24%]'>
								ID
							</th>
							<th scope='col' className='w-[18%] text-right'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='block divide-y divide-base-300 lg:table-row-group'>
						{syntaxes.map((syntax) => (
							<SyntaxRow
								key={syntax.id}
								syntax={syntax}
								onAction={reload}
							/>
						))}
					</tbody>
				</table>
			</div>
		</AdminSection>
	)
}

interface SyntaxRowProps {
	syntax: AdminSyntaxDto
	onAction?: () => void
}

const SyntaxRow: React.FC<SyntaxRowProps> = ({ syntax, onAction }) => {
	const [editing, setEditing] = useState(false)
	const [working, setWorking] = useState(false)
	const [name, setName] = useState(syntax.name)
	const [extension, setExtension] = useState(syntax.extension ?? '')
	const [color, setColor] = useState(syntax.color)
	const [error, setError] = useState<string | null>(null)
	const inputPrefix = `syntax-${syntax.id}`

	function startEdit() {
		setEditing(true)
		setError(null)
	}

	function cancelEdit() {
		setEditing(false)
		setName(syntax.name)
		setExtension(syntax.extension ?? '')
		setColor(syntax.color)
		setError(null)
	}

	async function saveEdit() {
		setWorking(true)
		setError(null)
		try {
			const result = await apiRequest(
				`/api/admin/syntaxes/${encodeURIComponent(syntax.id)}`,
				{
					method: 'PUT',
					json: {
						name,
						extension,
						color
					}
				}
			)

			if (!result.ok) {
				throw new Error(
					getApiErrorMessage(result.data, `Failed ${result.status}`)
				)
			}

			onAction?.()
			setEditing(false)
		} catch (e) {
			setError((e as Error).message || 'Update failed')
		} finally {
			setWorking(false)
		}
	}

	return (
		<tr className='grid grid-cols-1 gap-4 p-4 transition-colors hover:bg-base-200/50 sm:grid-cols-2 lg:table-row lg:p-0'>
			<td className='block min-w-0 p-0 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					Syntax
				</span>
				{editing ? (
					<>
						<label
							htmlFor={`${inputPrefix}-name`}
							className='sr-only'
						>
							Syntax name
						</label>
						<input
							id={`${inputPrefix}-name`}
							value={name}
							onChange={(event) => setName(event.target.value)}
							className='input input-bordered min-h-11 w-full lg:input-sm lg:min-h-9'
							placeholder='Name'
						/>
					</>
				) : (
					<span
						className='block break-words font-medium'
						title={syntax.name}
					>
						{syntax.name}
					</span>
				)}
			</td>

			<td className='block min-w-0 p-0 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					Extension
				</span>
				{editing ? (
					<>
						<label
							htmlFor={`${inputPrefix}-extension`}
							className='sr-only'
						>
							File extension
						</label>
						<input
							id={`${inputPrefix}-extension`}
							value={extension}
							onChange={(event) =>
								setExtension(event.target.value)
							}
							className='input input-bordered min-h-11 w-full font-mono lg:input-sm lg:min-h-9'
							placeholder='.ext'
						/>
					</>
				) : syntax.extension ? (
					<span className='badge badge-soft max-w-full font-mono font-semibold'>
						<span className='truncate'>{syntax.extension}</span>
					</span>
				) : (
					<span className='text-sm italic text-base-content/55'>
						No extension
					</span>
				)}
			</td>

			<td className='block min-w-0 p-0 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					Color
				</span>
				{editing ? (
					<div className='flex items-center gap-2'>
						<label
							htmlFor={`${inputPrefix}-color`}
							className='sr-only'
						>
							Highlight color
						</label>
						<input
							id={`${inputPrefix}-color`}
							type='text'
							value={color}
							onChange={(event) => setColor(event.target.value)}
							className='input input-bordered min-h-11 min-w-0 flex-1 font-mono lg:input-sm lg:min-h-9'
							placeholder='#abcdef'
						/>
						<span
							aria-hidden='true'
							className='size-6 shrink-0 rounded-md border border-base-300'
							style={{ backgroundColor: color }}
						/>
					</div>
				) : (
					<div className='flex min-w-0 items-center gap-2'>
						<span
							aria-hidden='true'
							className='size-5 shrink-0 rounded-md border border-base-300'
							style={{ backgroundColor: syntax.color }}
						/>
						<span className='min-w-0 break-all font-mono text-sm font-semibold'>
							{syntax.color}
						</span>
					</div>
				)}
			</td>

			<td className='block min-w-0 p-0 sm:col-span-2 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					ID
				</span>
				<span
					className='block break-all font-mono text-xs text-base-content/65'
					title={syntax.id}
				>
					{syntax.id}
				</span>
			</td>

			<td className='block min-w-0 p-0 sm:col-span-2 lg:table-cell lg:p-4 lg:text-right'>
				{editing ? (
					<div className='flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end'>
						<button
							type='button'
							onClick={saveEdit}
							className='btn btn-success min-h-11 gap-2 sm:btn-sm sm:min-h-10'
							disabled={working}
						>
							{working ? (
								<FaRotate
									aria-hidden='true'
									className='animate-spin'
								/>
							) : (
								<FaSave aria-hidden='true' />
							)}
							{working ? 'Saving...' : 'Save'}
						</button>
						<button
							type='button'
							onClick={cancelEdit}
							className='btn btn-ghost min-h-11 gap-2 sm:btn-sm sm:min-h-10'
							disabled={working}
						>
							<FaTimes aria-hidden='true' />
							Cancel
						</button>
					</div>
				) : (
					<button
						type='button'
						onClick={startEdit}
						className='btn btn-outline min-h-11 w-full gap-2 sm:w-auto lg:btn-sm lg:min-h-10'
						aria-label={`Edit syntax ${syntax.name}`}
					>
						<FaEdit aria-hidden='true' />
						Edit
					</button>
				)}
				{error && (
					<p
						className='mt-2 break-words text-left text-sm text-error lg:text-right'
						role='alert'
					>
						{error}
					</p>
				)}
			</td>
		</tr>
	)
}
