'use client'

import { useEffect, useState } from 'react'
import { FaDatabase, FaSync, FaTrash, FaUser } from 'react-icons/fa'
import type { AdminUserDto } from '@/app/types'
import { apiRequest, getApiErrorMessage } from '@/app/utils/api'
import { createDynamicAuthClient } from '@/app/utils/auth-client'

function toAdminUsers(
	users: Array<{
		id: string
		name: string
		email: string
		createdAt: string | Date
	}>
): AdminUserDto[] {
	return users.map((user) => ({
		id: user.id,
		name: user.name,
		email: user.email,
		createdAt: new Date(user.createdAt).toISOString()
	}))
}

export const AdminUsers: React.FC = () => {
	const [users, setUsers] = useState<AdminUserDto[]>([])
	const [total, setTotal] = useState(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false
		;(async () => {
			setLoading(true)
			try {
				const auth = createDynamicAuthClient()
				const res = await auth.admin.listUsers({
					query: { limit: 100, offset: 0 }
				})
				if (!cancelled) {
					setUsers(toAdminUsers(res.data?.users ?? []))
					setTotal(res.data?.total ?? 0)
				}
			} catch (e) {
				if (!cancelled)
					setError((e as Error).message || 'Failed to load users')
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
		const auth = createDynamicAuthClient()
		auth.admin
			.listUsers({ query: { limit: 100, offset: 0 } })
			.then((res) => {
				setUsers(toAdminUsers(res.data?.users ?? []))
				setTotal(res.data?.total ?? 0)
			})
			.catch((e) => setError(e.message || 'Failed to reload users'))
			.finally(() => setLoading(false))
	}

	return (
		<details className='collapse bg-base-200 collapse-arrow border border-base-300 rounded-lg'>
			<summary className='collapse-title text-xl font-medium'>
				<div className='flex items-center gap-3'>
					<span className='text-primary'>
						<FaUser />
					</span>
					<p className='font-semibold tracking-wide'>Users</p>
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
					<p className='text-sm opacity-70'>Fetching users...</p>
				)}
				{error && !loading && (
					<p className='text-error text-sm'>Error: {error}</p>
				)}
				{!loading &&
					!error &&
					(users.length ? (
						<div className='w-full overflow-x-auto -mx-2 px-2 pb-2 md:pb-0 relative'>
							<table className='table w-full min-w-[760px]'>
								<thead>
									<tr className='bg-base-300/60 backdrop-blur sticky top-0 z-10'>
										<th className='whitespace-nowrap'>
											ID
										</th>
										<th className='whitespace-nowrap'>
											Name
										</th>
										<th className='whitespace-nowrap'>
											Email
										</th>
										<th className='whitespace-nowrap'>
											Created
										</th>
										<th className='whitespace-nowrap'>
											Actions
										</th>
									</tr>
								</thead>
								<tbody>
									{users.map((user) => (
										<UserRow
											key={user.id}
											user={user}
											onActionComplete={reload}
										/>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p>No users found.</p>
					))}
			</div>
		</details>
	)
}

interface UserRowProps {
	user: AdminUserDto
	onActionComplete?: () => void
}

const UserRow: React.FC<UserRowProps> = ({ user, onActionComplete }) => {
	const [working, setWorking] = useState(false)
	const [error, setError] = useState<string | null>(null)

	async function deleteUser() {
		if (!confirm('Delete this user? This cannot be undone.')) return
		setWorking(true)
		setError(null)
		try {
			const result = await apiRequest(
				`/api/admin/users/${encodeURIComponent(user.id)}`,
				{ method: 'DELETE' }
			)

			if (!result.ok) {
				throw new Error(
					getApiErrorMessage(result.data, `Failed ${result.status}`)
				)
			}
			onActionComplete?.()
		} catch (e) {
			setError((e as Error).message || 'Delete failed')
		} finally {
			setWorking(false)
		}
	}

	return (
		<tr className='hover:bg-base-300/40 transition-colors'>
			<td className='font-mono truncate' title={user.id}>
				{user.id}
			</td>
			<td className='truncate' title={user.name}>
				<div className='flex items-center gap-1 truncate'>
					<FaUser className='opacity-60 shrink-0' />
					<span className='truncate'>{user.name}</span>
				</div>
			</td>
			<td className='truncate' title={user.email}>
				{user.email}
			</td>
			<td title={new Date(user.createdAt).toLocaleString('pl-PL')}>
				<div className='truncate'>
					{new Date(user.createdAt).toLocaleDateString('pl-PL')}
				</div>
			</td>
			<td className='space-x-2'>
				<button
					type='button'
					className='btn btn-sm btn-error flex items-center gap-1'
					disabled={working}
					onClick={deleteUser}
					title='Delete user'
				>
					{working ? (
						<FaSync className='animate-spin' />
					) : (
						<FaTrash />
					)}
				</button>
				{error && <span className='text-error'>{error}</span>}
			</td>
		</tr>
	)
}
