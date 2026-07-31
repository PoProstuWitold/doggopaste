'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FaBolt, FaLink, FaTrash } from 'react-icons/fa'
import type {
	AdminRealtimePasteDto,
	AdminRealtimePastesResponse
} from '@/app/types'
import { apiRequest, getApiErrorMessage } from '@/app/utils/api'
import { getContrastTextColor } from '@/app/utils/functions'
import { AdminConfirmDialog } from './AdminConfirmDialog'
import { AdminSection } from './AdminSection'

async function getAdminRealtimePastes(): Promise<AdminRealtimePasteDto[]> {
	const result = await apiRequest<AdminRealtimePastesResponse>(
		'/api/admin/pastes-realtime'
	)
	if (!result.ok) {
		throw new Error(
			getApiErrorMessage(result.data, `Failed ${result.status}`)
		)
	}

	return result.data?.data.realtimePastes ?? []
}

export const AdminRealtime: React.FC = () => {
	const [data, setData] = useState<AdminRealtimePasteDto[]>([])
	const [total, setTotal] = useState<number>(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			setLoading(true)
			try {
				const realtimePastes = await getAdminRealtimePastes()
				if (!cancelled) {
					setData(realtimePastes)
					setTotal(realtimePastes.length)
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

	async function reload() {
		setLoading(true)
		setError(null)
		try {
			const realtimePastes = await getAdminRealtimePastes()
			setData(realtimePastes)
			setTotal(realtimePastes.length)
		} catch (e) {
			setError((e as Error).message || 'Failed to reload realtime pastes')
		} finally {
			setLoading(false)
		}
	}

	return (
		<AdminSection
			id='admin-realtime'
			title='Realtime Editors'
			description='Review active collaborative editors and their current syntax.'
			icon={<FaBolt />}
			count={total}
			loading={loading}
			error={error}
			loadingLabel='Fetching realtime pastes...'
			emptyTitle='No realtime editors found'
			emptyDescription='There are no realtime pastes to display.'
			isEmpty={data.length === 0}
			onReload={reload}
		>
			<div className='overflow-hidden rounded-xl border border-base-300 bg-base-100'>
				<table className='table block! w-full lg:table! lg:table-fixed'>
					<caption className='sr-only'>
						Realtime paste editors
					</caption>
					<thead className='hidden bg-base-200/70 lg:table-header-group'>
						<tr>
							<th scope='col' className='w-[34%]'>
								Editor
							</th>
							<th scope='col' className='w-[18%]'>
								Syntax
							</th>
							<th scope='col' className='w-[20%]'>
								Updated
							</th>
							<th scope='col' className='w-[18%]'>
								ID
							</th>
							<th scope='col' className='w-[10%] text-right'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='block divide-y divide-base-300 lg:table-row-group'>
						{data.map((realtimePaste) => (
							<RealtimeRow
								key={realtimePaste.paste.id}
								realtimePaste={realtimePaste}
								onAction={reload}
							/>
						))}
					</tbody>
				</table>
			</div>
		</AdminSection>
	)
}

interface RealtimeRowProps {
	realtimePaste: AdminRealtimePasteDto
	onAction?: () => void
}

const RealtimeRow: React.FC<RealtimeRowProps> = ({
	realtimePaste,
	onAction
}) => {
	const { paste, syntax } = realtimePaste
	const syntaxColor = syntax?.color ?? '#808080'
	const syntaxName = syntax?.name ?? 'Plaintext'
	const [working, setWorking] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [confirmOpen, setConfirmOpen] = useState(false)

	async function deletePaste() {
		setWorking(true)
		setError(null)
		try {
			const result = await apiRequest(
				`/api/admin/pastes-realtime/${encodeURIComponent(paste.id)}`,
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

	const pasteLabel = paste.title || paste.slug || paste.id

	return (
		<tr className='grid grid-cols-1 gap-4 p-4 transition-colors hover:bg-base-200/50 sm:grid-cols-2 lg:table-row lg:p-0'>
			<td className='block min-w-0 p-0 sm:col-span-2 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					Editor
				</span>
				<div className='flex min-w-0 items-start gap-2'>
					<FaBolt
						aria-hidden='true'
						className='mt-1 shrink-0 text-primary'
					/>
					<div className='min-w-0'>
						<p
							className='break-words font-medium'
							title={paste.title}
						>
							{paste.title || (
								<span className='italic text-base-content/60'>
									(no title)
								</span>
							)}
						</p>
						{paste.slug ? (
							<Link
								prefetch={false}
								href={`/r/${paste.slug}`}
								className='mt-1 inline-flex max-w-full items-center gap-1 font-mono text-xs text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
								aria-label={`Open realtime paste ${paste.slug}`}
							>
								<FaLink
									aria-hidden='true'
									className='shrink-0'
								/>
								<span className='truncate'>{paste.slug}</span>
							</Link>
						) : (
							<span className='mt-1 block text-xs text-base-content/50'>
								No slug
							</span>
						)}
					</div>
				</div>
			</td>

			<td className='block min-w-0 p-0 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					Syntax
				</span>
				<span
					className='badge max-w-full font-semibold'
					style={{
						backgroundColor: syntaxColor,
						color: getContrastTextColor(syntaxColor)
					}}
					title={syntaxName}
				>
					<span className='truncate'>{syntaxName}</span>
				</span>
			</td>

			<td className='block min-w-0 p-0 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					Updated
				</span>
				<time
					dateTime={paste.updatedAt}
					className='text-sm'
					title={new Date(paste.updatedAt).toLocaleString('pl-PL')}
				>
					{new Date(paste.updatedAt).toLocaleString('pl-PL')}
				</time>
			</td>

			<td className='block min-w-0 p-0 sm:col-span-2 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					ID
				</span>
				<span
					className='block break-all font-mono text-xs text-base-content/65'
					title={paste.id}
				>
					{paste.id}
				</span>
			</td>

			<td className='block min-w-0 p-0 sm:col-span-2 lg:table-cell lg:p-4 lg:text-right'>
				<button
					type='button'
					className='btn btn-error btn-outline min-h-11 w-full gap-2 sm:w-auto lg:btn-sm lg:min-h-10'
					disabled={working}
					onClick={() => {
						setError(null)
						setConfirmOpen(true)
					}}
					aria-label={`Delete realtime paste ${pasteLabel}`}
				>
					<FaTrash aria-hidden='true' />
					Delete
				</button>
				<AdminConfirmDialog
					open={confirmOpen}
					title='Delete realtime paste?'
					description='This permanently deletes the selected realtime paste. This action cannot be undone.'
					itemLabel={pasteLabel}
					working={working}
					error={error}
					onClose={() => {
						setConfirmOpen(false)
						setError(null)
					}}
					onConfirm={deletePaste}
				/>
			</td>
		</tr>
	)
}
