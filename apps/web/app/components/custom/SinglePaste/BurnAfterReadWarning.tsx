'use client'

import { useState } from 'react'
import { FaFire } from 'react-icons/fa'
import { FaXmark } from 'react-icons/fa6'
import type { Paste } from '../../../types'

export function BurnAfterReadWarning({
	expiration,
	isLocked
}: {
	expiration: Paste['expiration']
	isLocked: boolean
}) {
	const [isVisible, setIsVisible] = useState(expiration === 'burn_after_read')

	if (!isVisible) return null

	return (
		<div className='alert alert-error shadow-lg mb-4 max-w-7xl mx-auto relative'>
			<button
				className='absolute top-2 right-2 text-xl font-bold text-error-content hover:text-white transition-colors'
				onClick={() => setIsVisible(false)}
				aria-label='Close warning'
				type='button'
			>
				<FaXmark className='w-5 h-5' />
			</button>
			<div className='flex items-start md:items-center gap-3 pr-6'>
				<FaFire className='w-6 h-6 shrink-0 animate-pulse' />
				<div>
					{isLocked ? (
						<span>
							<span className='font-black uppercase'>
								Burn After Read:
							</span>{' '}
							This paste is set to self-destruct. It will be{' '}
							<strong>
								permanently deleted from the server immediately
								after you unlock it
							</strong>
							. Make sure to write the content down once unlocked.
						</span>
					) : (
						<span>
							<span className='font-black uppercase'>
								Data Vanished:
							</span>{' '}
							This paste was in <i>"Burn After Read"</i> mode. It
							has been displayed once and{' '}
							<strong>no longer exists on the server</strong>. If
							you refresh this page or close the tab, the content
							will be lost forever.
						</span>
					)}
				</div>
			</div>
		</div>
	)
}
