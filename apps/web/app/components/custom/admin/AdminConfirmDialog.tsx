'use client'

import {
	Description,
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle
} from '@headlessui/react'
import { FaRotate, FaTrash, FaTriangleExclamation } from 'react-icons/fa6'

interface AdminConfirmDialogProps {
	open: boolean
	title: string
	description: string
	itemLabel: string
	working: boolean
	error: string | null
	onClose: () => void
	onConfirm: () => void
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
	open,
	title,
	description,
	itemLabel,
	working,
	error,
	onClose,
	onConfirm
}) => {
	function close() {
		if (!working) onClose()
	}

	return (
		<Dialog open={open} onClose={close} className='relative z-[100]'>
			<DialogBackdrop className='fixed inset-0 bg-black/55 backdrop-blur-[1px] transition-opacity data-[closed]:opacity-0' />
			<div className='fixed inset-0 overflow-y-auto p-4 sm:p-6'>
				<div className='flex min-h-full items-center justify-center'>
					<DialogPanel
						transition
						className='w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-5 text-base-content transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 sm:p-6'
						aria-busy={working}
					>
						<div className='flex items-start gap-3'>
							<span className='grid size-11 shrink-0 place-items-center rounded-xl border border-error/25 bg-error/10 text-error'>
								<FaTriangleExclamation aria-hidden='true' />
							</span>
							<div className='min-w-0'>
								<DialogTitle className='text-lg font-semibold sm:text-xl'>
									{title}
								</DialogTitle>
								<Description className='mt-1 text-sm leading-relaxed text-base-content/70'>
									{description}
								</Description>
							</div>
						</div>

						<div className='mt-5 rounded-xl border border-base-300 bg-base-200/60 px-3 py-2.5 font-mono text-sm break-all'>
							{itemLabel}
						</div>

						{error && (
							<p
								className='mt-4 rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error break-words'
								role='alert'
							>
								{error}
							</p>
						)}

						<div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
							<button
								type='button'
								onClick={close}
								className='btn btn-ghost min-h-11 sm:min-h-10'
								disabled={working}
							>
								Cancel
							</button>
							<button
								type='button'
								onClick={onConfirm}
								className='btn btn-error min-h-11 gap-2 sm:min-h-10'
								disabled={working}
							>
								{working ? (
									<FaRotate
										aria-hidden='true'
										className='animate-spin'
									/>
								) : (
									<FaTrash aria-hidden='true' />
								)}
								{working ? 'Deleting...' : 'Delete'}
							</button>
						</div>
					</DialogPanel>
				</div>
			</div>
		</Dialog>
	)
}
