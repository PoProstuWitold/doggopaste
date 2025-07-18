'use client'

import {
	Description,
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle
} from '@headlessui/react'
import type React from 'react'
import { useState } from 'react'
import { FaXmark } from 'react-icons/fa6'

interface CustomDialogProps {
	btnContent?: string | React.ReactNode
	title?: string
	description?: string
	children?: React.ReactNode
	btnClasses?: string
	isOpen?: boolean
	onClose?: () => void
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
	btnContent = 'Click me',
	title = 'DoggoPaste',
	description = 'This is a custom dialog',
	btnClasses = 'btn btn-outline',
	children,
	isOpen,
	onClose
}) => {
	const [internalOpen, setInternalOpen] = useState(false)

	const open = typeof isOpen === 'boolean' ? isOpen : internalOpen
	const close = onClose || (() => setInternalOpen(false))
	const openDialog = () => setInternalOpen(true)

	return (
		<>
			{typeof isOpen !== 'boolean' && (
				<button
					type='button'
					onClick={openDialog}
					className={btnClasses}
				>
					{btnContent}
				</button>
			)}
			<Dialog
				open={open}
				onClose={close}
				className='fixed inset-0 flex w-screen items-center justify-center bg-black/30 p-4 transition duration-300 ease-out data-[closed]:opacity-0'
				transition
			>
				<DialogBackdrop className='fixed inset-0 bg-black/30' />
				<div className='fixed inset-0 flex w-screen items-center justify-center'>
					<DialogPanel className='p-5 rounded-xl bg-base-200 w-sm md:w-lg'>
						<DialogTitle className='font-bold text-xl flex justify-between items-center'>
							<p>{title}</p>
							<button
								className='btn btn-error btn-soft'
								type='button'
								onClick={close}
							>
								<FaXmark className='text-2xl' />
							</button>
						</DialogTitle>
						<Description>{description}</Description>
						<div className='mt-4 flex flex-col gap-2'>
							{children}
						</div>
					</DialogPanel>
				</div>
			</Dialog>
		</>
	)
}
