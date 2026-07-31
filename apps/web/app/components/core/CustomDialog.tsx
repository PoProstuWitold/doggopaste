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
				className='fixed inset-0 z-[100] w-screen overflow-y-auto p-4 transition duration-300 ease-out data-[closed]:opacity-0'
				transition
			>
				<DialogBackdrop className='fixed inset-0 bg-black/30' />
				<div className='relative flex min-h-full w-full items-center justify-center'>
					<DialogPanel className='max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl bg-base-200 p-5 md:max-w-lg'>
						<DialogTitle
							as='div'
							className='flex items-center justify-between gap-4'
						>
							<h2 className='text-xl font-bold'>{title}</h2>
							<button
								className='btn btn-error btn-soft'
								type='button'
								onClick={close}
								aria-label='Close dialog'
							>
								<FaXmark
									className='text-2xl'
									aria-hidden='true'
								/>
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
