'use client'
import {
	Description,
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle
} from '@headlessui/react'
import { useState } from 'react'
import { FaXmark } from 'react-icons/fa6'

interface CustomDialogProps {
	btnText?: string
	title?: string
	description?: string
	children?: React.ReactNode
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
	btnText = 'Click me',
	title = 'DoggoPaste',
	description = 'This is a custom dialog',
	children
}) => {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			<button
				type='button'
				onClick={() => setIsOpen(true)}
				className='btn btn-outline'
			>
				{btnText}
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
						<div className='mt-4 flex flex-col gap-2'>{children}</div>
					</DialogPanel>
				</div>
			</Dialog>
		</>
	)
}
