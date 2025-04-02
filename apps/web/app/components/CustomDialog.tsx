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
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
	btnContent = 'Click me',
	title = 'DoggoPaste',
	description = 'This is a custom dialog',
	btnClasses = 'btn btn-outline',
	children
}) => {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			<button
				type='button'
				onClick={() => setIsOpen(true)}
				className={btnClasses}
			>
				{btnContent}
			</button>
			<Dialog
				open={isOpen}
				onClose={() => setIsOpen(false)}
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
								onClick={() => setIsOpen(false)}
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
