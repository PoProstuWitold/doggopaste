'use client'

import { FaFileCode } from 'react-icons/fa'
import type { Paste, ViewerDto } from '../../types'
import { PasteButtons } from './PasteButtons'
import { BurnAfterReadWarning } from './SinglePaste/BurnAfterReadWarning'
import { PasteContent } from './SinglePaste/PasteContent'
import { PasteMetadata } from './SinglePaste/PasteMetadata'
import { usePasteUnlock } from './SinglePaste/usePasteUnlock'

export default function SinglePaste({
	slug,
	paste,
	viewer
}: {
	slug: string
	paste: Paste
	viewer: ViewerDto | null
}) {
	const {
		content,
		handleUnlock,
		isClientLocked,
		isProcessing,
		isServerLocked,
		passwordInput,
		setPasswordInput,
		showLockScreen
	} = usePasteUnlock(slug, paste)

	return (
		<div className='mb-20'>
			<BurnAfterReadWarning
				expiration={paste.expiration}
				isLocked={showLockScreen}
			/>

			<div className='flex flex-col gap-4 p-5 rounded-lg bg-base-200 mx-auto max-w-8xl'>
				<div className='flex lg:flex-row flex-col items-center font-bold text-center gap-4 justify-center'>
					<div className='flex flex-row items-center text-2xl font-bold text-center gap-4 justify-center'>
						<FaFileCode className='w-7 h-7' />
						Static Paste "{paste.slug}"
					</div>
					<div className='divider lg:divider-horizontal' />
					<PasteButtons
						paste={paste}
						viewer={viewer}
						isLocked={showLockScreen}
						content={content}
					/>
				</div>
				<div className='divider p-0 m-0' />
				<div className='flex flex-col md:flex-row gap-4'>
					<div className='w-full'>
						<div className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>Slug</span>
							</div>
							<p className='rounded-lg shadow gap-2 bg-base-300 p-2'>
								{slug}
							</p>
						</div>
					</div>
					<div className='w-full'>
						<div className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>Title</span>
							</div>
							<p className='rounded-lg shadow gap-2 bg-base-300 p-2'>
								{paste.title}
							</p>
						</div>
					</div>
				</div>
				{paste.description && (
					<div className='w-full'>
						<div className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>Description</span>
							</div>
							<p className='rounded-lg shadow gap-2 whitespace-pre-wrap wrap-break-word bg-base-300 p-2'>
								{paste.description}
							</p>
						</div>
					</div>
				)}
				<PasteContent
					content={content}
					handleUnlock={handleUnlock}
					isProcessing={isProcessing}
					isServerLocked={isServerLocked}
					passwordInput={passwordInput}
					paste={paste}
					setPasswordInput={setPasswordInput}
					showLockScreen={showLockScreen}
				/>
				<PasteMetadata
					content={content}
					isClientLocked={isClientLocked}
					isServerLocked={isServerLocked}
					paste={paste}
					showLockScreen={showLockScreen}
				/>
			</div>
		</div>
	)
}
