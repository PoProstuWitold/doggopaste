'use client'

import { useEffect, useState } from 'react'
import { FaTrash, FaUser } from 'react-icons/fa'
import { FaUserGroup } from 'react-icons/fa6'
import type { AdminUserDto } from '@/app/types'
import { apiRequest, getApiErrorMessage } from '@/app/utils/api'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { AdminConfirmDialog } from './AdminConfirmDialog'
import { AdminSection } from './AdminSection'

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
		<AdminSection
			id='admin-users'
			title='Users'
			description='Review registered accounts and remove users when necessary.'
			icon={<FaUserGroup />}
			count={total}
			loading={loading}
			error={error}
			loadingLabel='Fetching users...'
			emptyTitle='No users found'
			emptyDescription='There are no user accounts to display.'
			isEmpty={users.length === 0}
			onReload={reload}
		>
			<div className='overflow-hidden rounded-xl border border-base-300 bg-base-100'>
				<table className='table block! w-full lg:table! lg:table-fixed'>
					<caption className='sr-only'>
						Registered DoggoPaste users
					</caption>
					<thead className='hidden bg-base-200/70 lg:table-header-group'>
						<tr>
							<th scope='col' className='w-[22%]'>
								Name
							</th>
							<th scope='col' className='w-[28%]'>
								Email
							</th>
							<th scope='col' className='w-[18%]'>
								Created
							</th>
							<th scope='col' className='w-[22%]'>
								ID
							</th>
							<th scope='col' className='w-[10%] text-right'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody className='block divide-y divide-base-300 lg:table-row-group'>
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
		</AdminSection>
	)
}

interface UserRowProps {
	user: AdminUserDto
	onActionComplete?: () => void
}

const UserRow: React.FC<UserRowProps> = ({ user, onActionComplete }) => {
	const [working, setWorking] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [confirmOpen, setConfirmOpen] = useState(false)

	async function deleteUser() {
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
			setConfirmOpen(false)
			onActionComplete?.()
		} catch (e) {
			setError((e as Error).message || 'Delete failed')
		} finally {
			setWorking(false)
		}
	}

	return (
		<tr className='grid grid-cols-1 gap-4 p-4 transition-colors hover:bg-base-200/50 sm:grid-cols-2 lg:table-row lg:p-0'>
			<td className='block min-w-0 p-0 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					Name
				</span>
				<div className='flex min-w-0 items-center gap-2 font-medium'>
					<FaUser
						aria-hidden='true'
						className='shrink-0 opacity-55'
					/>
					<span className='min-w-0 break-words' title={user.name}>
						{user.name}
					</span>
				</div>
			</td>
			<td className='block min-w-0 p-0 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					Email
				</span>
				<span className='block break-all' title={user.email}>
					{user.email}
				</span>
			</td>
			<td className='block min-w-0 p-0 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					Created
				</span>
				<time
					dateTime={user.createdAt}
					title={new Date(user.createdAt).toLocaleString('pl-PL')}
					className='whitespace-nowrap text-sm'
				>
					{new Date(user.createdAt).toLocaleDateString('pl-PL')}
				</time>
			</td>
			<td className='block min-w-0 p-0 lg:table-cell lg:p-4'>
				<span className='mb-1 block text-xs font-semibold uppercase tracking-wide text-base-content/55 lg:hidden'>
					ID
				</span>
				<span
					className='block break-all font-mono text-xs text-base-content/70'
					title={user.id}
				>
					{user.id}
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
					aria-label={`Delete user ${user.name}`}
				>
					<FaTrash aria-hidden='true' />
					Delete
				</button>
				<AdminConfirmDialog
					open={confirmOpen}
					title='Delete user?'
					description='This permanently deletes the user and all associated data. This action cannot be undone.'
					itemLabel={`${user.name} (${user.email})`}
					working={working}
					error={error}
					onClose={() => {
						setConfirmOpen(false)
						setError(null)
					}}
					onConfirm={deleteUser}
				/>
			</td>
		</tr>
	)
}
