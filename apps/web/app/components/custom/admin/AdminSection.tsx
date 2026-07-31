'use client'

import type { ReactNode } from 'react'
import {
	FaChevronDown,
	FaDatabase,
	FaInbox,
	FaRotate,
	FaTriangleExclamation
} from 'react-icons/fa6'

interface AdminSectionProps {
	id: string
	title: string
	description: string
	icon: ReactNode
	count: number
	loading: boolean
	error: string | null
	loadingLabel: string
	emptyTitle: string
	emptyDescription: string
	isEmpty: boolean
	onReload: () => void
	children: ReactNode
}

export const AdminSection: React.FC<AdminSectionProps> = ({
	id,
	title,
	description,
	icon,
	count,
	loading,
	error,
	loadingLabel,
	emptyTitle,
	emptyDescription,
	isEmpty,
	onReload,
	children
}) => {
	const headingId = `${id}-heading`
	const contentId = `${id}-content`

	return (
		<section
			id={id}
			aria-labelledby={headingId}
			className='scroll-mt-28 target:rounded-2xl target:outline target:outline-2 target:outline-offset-4 target:outline-primary/50'
		>
			<details className='group overflow-hidden rounded-2xl border border-base-300 bg-base-100 transition-colors open:border-primary/40'>
				<summary
					aria-controls={contentId}
					className='flex min-h-24 cursor-pointer list-none items-center gap-3 p-4 marker:hidden transition-colors hover:bg-base-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary sm:gap-4 sm:p-5 [&::-webkit-details-marker]:hidden'
				>
					<span className='grid size-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-xl text-primary sm:size-12'>
						<span aria-hidden='true'>{icon}</span>
					</span>

					<div className='min-w-0 flex-1'>
						<h2
							id={headingId}
							className='block text-lg font-semibold tracking-tight sm:text-xl'
						>
							{title}
						</h2>
						<p className='mt-1 block text-sm leading-relaxed text-base-content/70'>
							{description}
						</p>
					</div>

					<span className='flex shrink-0 items-center gap-2'>
						{loading ? (
							<span className='badge badge-outline gap-1.5 whitespace-nowrap'>
								<FaRotate
									aria-hidden='true'
									className='animate-spin'
								/>
								<span className='hidden sm:inline'>
									Loading
								</span>
							</span>
						) : error ? (
							<span className='badge badge-error gap-1.5 whitespace-nowrap'>
								<FaTriangleExclamation aria-hidden='true' />
								<span className='hidden sm:inline'>Error</span>
							</span>
						) : (
							<span className='badge badge-accent gap-1.5 whitespace-nowrap'>
								<FaDatabase aria-hidden='true' />
								{count}
								<span className='hidden sm:inline'>total</span>
							</span>
						)}
						<FaChevronDown
							aria-hidden='true'
							className='transition-transform duration-200 group-open:rotate-180'
						/>
					</span>
				</summary>

				<div
					id={contentId}
					className='border-t border-base-300 p-4 sm:p-5'
					aria-busy={loading}
				>
					<div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
						{!loading && !error && (
							<p className='min-w-0 text-sm text-base-content/70'>
								{count} {count === 1 ? 'record' : 'records'}{' '}
								available.
							</p>
						)}
						<button
							type='button'
							onClick={onReload}
							className='btn btn-outline min-h-11 w-full gap-2 sm:btn-sm sm:ml-auto sm:min-h-10 sm:w-auto'
							disabled={loading}
						>
							<FaRotate
								aria-hidden='true'
								className={loading ? 'animate-spin' : ''}
							/>
							Reload
						</button>
					</div>

					{loading ? (
						<div
							className='flex min-h-32 items-center justify-center gap-3 rounded-xl border border-dashed border-base-300 bg-base-200/40 p-6 text-sm text-base-content/70'
							role='status'
						>
							<FaRotate
								aria-hidden='true'
								className='animate-spin text-primary'
							/>
							{loadingLabel}
						</div>
					) : error ? (
						<div
							className='rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error'
							role='alert'
						>
							<div className='flex items-start gap-3'>
								<FaTriangleExclamation
									aria-hidden='true'
									className='mt-0.5 shrink-0'
								/>
								<p className='min-w-0 break-words'>
									<span className='font-semibold'>
										Error:
									</span>{' '}
									{error}
								</p>
							</div>
						</div>
					) : isEmpty ? (
						<div className='flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-200/30 p-6 text-center'>
							<FaInbox
								aria-hidden='true'
								className='mb-3 text-3xl text-base-content/40'
							/>
							<p className='font-semibold'>{emptyTitle}</p>
							<p className='mt-1 max-w-md text-sm text-base-content/65'>
								{emptyDescription}
							</p>
						</div>
					) : (
						children
					)}
				</div>
			</details>
		</section>
	)
}
