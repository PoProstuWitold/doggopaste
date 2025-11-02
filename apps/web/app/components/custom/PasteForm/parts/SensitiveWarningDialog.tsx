'use client'

import { CustomDialog } from '@/app/components/core/CustomDialog'

export function SensitiveWarningDialog({
	isOpen,
	onCancel,
	onAccept,
	matchedLines
}: {
	isOpen: boolean
	onCancel: () => void
	onAccept: () => void
	matchedLines: Array<{ word: string; lines: number[] }>
}) {
	if (!isOpen) return null
	return (
		<CustomDialog
			isOpen={isOpen}
			onClose={onCancel}
			title='Potential sensitive content detected'
			description='Your paste may contain secrets. Proceed only if you are sure.'
			btnClasses='hidden'
		>
			<ul className='list-disc ml-5'>
				{matchedLines.map(({ word, lines }) => (
					<li
						key={`${word}-${lines[0]}`}
						className='text-error font-semibold'
					>
						{word} (lines {lines.join(', ')})
					</li>
				))}
			</ul>

			<div className='flex justify-end gap-2 mt-4'>
				<button className='btn' type='button' onClick={onCancel}>
					Cancel
				</button>
				<button
					className='btn btn-error btn-outline'
					onClick={onAccept}
					type='button'
				>
					I accept the risk
				</button>
			</div>
		</CustomDialog>
	)
}
