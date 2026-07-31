import type { Metadata } from 'next'
import { FaShieldHalved } from 'react-icons/fa6'
import { AdminNavigation } from '../components/custom/admin/AdminNavigation'
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
			<section className='mx-auto max-w-3xl rounded-2xl border border-base-300 bg-base-100 p-6 sm:p-8'>
				<div className='flex items-start gap-4'>
					<span className='grid size-12 shrink-0 place-items-center rounded-xl border border-warning/25 bg-warning/10 text-xl text-warning'>
						<FaShieldHalved aria-hidden='true' />
					</span>
					<div className='min-w-0'>
						<h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>
							Admin Dashboard
						</h1>
						<p className='mt-2 leading-relaxed text-base-content/70'>
							You must be logged in to access the admin dashboard.
						</p>
					</div>
				</div>
			</section>
		)
	}

	return (
		<div className='mx-auto mb-20 flex w-full max-w-[100rem] flex-col gap-5'>
			<header className='overflow-hidden rounded-2xl border border-base-300 bg-base-100'>
				<div className='flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between'>
					<div className='flex min-w-0 items-start gap-4'>
						<span className='grid size-12 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-xl text-primary sm:size-14 sm:text-2xl'>
							<FaShieldHalved aria-hidden='true' />
						</span>
						<div className='min-w-0'>
							<h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>
								Admin Dashboard
							</h1>
							<p className='mt-2 max-w-3xl leading-relaxed text-base-content/70'>
								Manage users, static pastes, realtime editors,
								tags and syntaxes across DoggoPaste.
							</p>
						</div>
					</div>
					<div className='badge badge-primary badge-outline min-h-8 max-w-full gap-2 self-start px-3'>
						<FaShieldHalved aria-hidden='true' />
						<span className='truncate' title={viewer.name}>
							Administrator: {viewer.name}
						</span>
					</div>
				</div>

				<AdminNavigation />
			</header>
			<AdminUsers />
			<AdminPastes />
			<AdminRealtime />
			<AdminTags />
			<AdminSyntaxes />
		</div>
	)
}
