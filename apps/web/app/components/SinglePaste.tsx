'use client'

import CodeMirror from '@uiw/react-codemirror'
import { useState } from 'react'
import { FaFileCode, FaInfoCircle } from 'react-icons/fa'
import { useTheme } from '../context/ThemeContext'
import type { Paste } from '../types'
import { extensions } from '../utils/functions'
import { PasteButtons } from './PasteButton'

export default function SinglePaste({
	slug,
	paste
}: {
	slug: string
	paste: Paste
}) {
	const { cmTheme } = useTheme()
	const [showWarning, setShowWarning] = useState<boolean>(
		paste.expiration === 'burn_after_read'
	)

	return (
		<>
			{showWarning && (
				<div className='alert alert-error shadow-lg mb-4 max-w-7xl mx-auto relative'>
					<button
						className='absolute top-2 right-2 text-xl font-bold text-error-content hover:text-error'
						onClick={() => setShowWarning(false)}
						aria-label='Close warning'
						type='button'
					>
						×
					</button>
					<div>
						<span className='font-semibold'>Warning!</span> This
						paste will be <strong>permanently deleted</strong> after
						refreshing this website or closing the tab as it's
						expiration mode is set to <i>"burn after read"</i>.
					</div>
				</div>
			)}

			<div className='flex flex-col gap-4 p-5 rounded-lg shadow-xl bg-base-200 mx-auto max-w-7xl'>
				<div className='flex lg:flex-row flex-col items-center font-bold text-center gap-4 justify-center'>
					<div className='flex flex-row items-center text-3xl font-bold text-center gap-4 justify-center'>
						<FaFileCode className='w-10 h-10' />
						Paste "{slug}"
					</div>
					<div className='divider lg:divider-horizontal' />
					<PasteButtons slug={slug} />
				</div>

				<div className='flex flex-col lg:flex-row gap-4'>
					<div className='w-full flex flex-col gap-4 min-w-0'>
						<div className='form-control w-full flex-1 min-w-0'>
							<div className='label'>
								<span className='label-text'>Content</span>
							</div>
							<div className='min-w-0'>
								<CodeMirror
									value={paste.content}
									extensions={[
										extensions[paste.syntax] ?? []
									]}
									readOnly={true}
									onChange={() => {}}
									basicSetup={{
										lineNumbers: true,
										highlightActiveLine: true,
										highlightActiveLineGutter: true,
										foldGutter: true,
										tabSize: 4,
										history: false,
										syntaxHighlighting: true
									}}
									className='rounded-lg border overflow-auto h-[650px]'
									theme={cmTheme}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className='divider ' />
				{/* Paste metadata */}
				<div className='flex lg:flex-row flex-col items-center font-bold text-center gap-4 justify-center'>
					<div className='flex flex-row items-center text-xl font-bold text-center gap-4 justify-center'>
						<FaInfoCircle className='w-10 h-10' />
						Paste Metadata
					</div>
				</div>
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
					<PasteDetail label='Title' value={paste.title} />
					<PasteDetail label='Category' value={paste.category} />
					<PasteDetail label='Visibility' value={paste.visibility} />
					<PasteDetail label='Expiration' value={paste.expiration} />
					<PasteDetail label='Syntax' value={paste.syntax} />
					<PasteDetail
						label='Tags'
						value={
							<div className='flex flex-wrap gap-2'>
								{paste.tags.length
									? paste.tags.map((tag, index) => (
											<div
												key={`${index}:${tag}`}
												className='badge badge-primary flex items-center gap-2'
											>
												{tag}
											</div>
										))
									: 'No tags'}
							</div>
						}
					/>
					<PasteDetail
						label='Password'
						value={paste.passwordHash ? 'Enabled' : 'Disabled'}
					/>
					<PasteDetail
						label='Created at'
						value={new Date(paste.createdAt).toLocaleString(
							'pl-PL'
						)}
					/>
					{paste.expiresAt && (
						<PasteDetail
							label='Expires at'
							value={new Date(paste.expiresAt).toLocaleString(
								'pl-PL'
							)}
						/>
					)}
				</div>
			</div>
		</>
	)
}

function PasteDetail({
	label,
	value
}: {
	label: string
	value: string | React.ReactNode
}) {
	return (
		<div className='bg-base-300 rounded-lg p-4 shadow flex flex-col gap-2'>
			<div className='text-sm text-base-content/70'>{label}</div>
			<div className='font-medium break-words'>{value}</div>
		</div>
	)
}
