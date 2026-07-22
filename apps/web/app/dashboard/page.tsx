import type { Metadata } from 'next'
import { AdminPastes } from '../components/custom/admin/AdminPastes'
import { AdminRealtime } from '../components/custom/admin/AdminRealtime'
import { AdminSyntaxes } from '../components/custom/admin/AdminSyntaxes'
import { AdminTags } from '../components/custom/admin/AdminTags'
import { AdminUsers } from '../components/custom/admin/AdminUsers'
import { getCurrentViewer } from '../utils/session'

export const metadata: Metadata = {
	title: 'Admin Dashboard',
	description: 'Administrative dashboard for managing DoggoPaste.'
}

export default async function HomePage() {
	const viewer = await getCurrentViewer()

	if (!viewer) {
		return (
			<div>
				<h1 className='text-2xl font-semibold'>Admin Dashboard</h1>
				<p>You must be logged in to access the admin dashboard.</p>
			</div>
		)
	}

	return (
		<div className='flex flex-col gap-4 mb-20'>
			<header>
				<h1 className='text-2xl font-semibold'>Admin Dashboard</h1>
				<p>
					Welcome, {viewer.name}! Manage users, static pastes,
					realtime editors, tags and syntaxes across DoggoPaste.
				</p>
			</header>
			<AdminUsers />
			<AdminPastes />
			<AdminRealtime />
			<AdminTags />
			<AdminSyntaxes />
		</div>
	)
}
