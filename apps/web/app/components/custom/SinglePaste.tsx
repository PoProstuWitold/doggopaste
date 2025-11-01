'use client'

import CodeMirror from '@uiw/react-codemirror'
import { useState } from 'react'
import { BiCategory } from 'react-icons/bi'
import { BsShieldLock } from 'react-icons/bs'
import {
	FaClock,
	FaCode,
	FaEye,
	FaFileCode,
	FaGlobe,
	FaInfoCircle,
	FaRegEdit,
	FaTags
} from 'react-icons/fa'
import { FaRegHourglassHalf } from 'react-icons/fa6'
import { useTheme } from '../../context/ThemeContext'
import type { Paste, User } from '../../types'
import {
	extensions,
	firstLetterUppercase,
	getCategoryLabel,
	getContrastTextColor,
	getExpirationLabel
} from '../../utils/functions'
import { PasteButtons } from './PasteButtons'

export default function SinglePaste({
	slug,
	paste,
	user
}: {
	slug: string
	paste: Paste
	user: User | null
}) {
	const bgColor = paste.syntax.color

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
					<div className='flex flex-row items-center text-2xl font-bold text-center gap-4 justify-center'>
						<FaFileCode className='w-7 h-7' />
						Static Paste "{paste.slug}"
					</div>
					<div className='divider lg:divider-horizontal' />
					<PasteButtons paste={paste} user={user} />
				</div>
				<div className='divider p-0 m-0' />
				{/* Slug */}
				<div className='w-full'>
					<div className='form-control w-full'>
						<div className='label'>
							<span className='label-text'>Slug</span>
						</div>
						<p className='rounded-lg shadow gap-2 whitespace-pre-wrap break-words bg-base-300 p-2'>
							{slug}
						</p>
					</div>
				</div>
				{/* Slug */}
				<div className='w-full'>
					<div className='form-control w-full'>
						<div className='label'>
							<span className='label-text'>Title</span>
						</div>
						<p className='rounded-lg shadow gap-2 whitespace-pre-wrap break-words bg-base-300 p-2'>
							{paste.title}
						</p>
					</div>
				</div>
				{/* Description */}
				{paste.description && (
					<div className='w-full'>
						<div className='form-control w-full'>
							<div className='label'>
								<span className='label-text'>Description</span>
							</div>
							<p className='rounded-lg shadow gap-2 whitespace-pre-wrap break-words bg-base-300 p-2'>
								{paste.description}
							</p>
						</div>
					</div>
				)}

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
										extensions[paste.syntax.name] ?? []
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
									className='overflow-auto max-h-[650px]'
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
					<PasteDetail
						label='Category'
						icon={<BiCategory className='w-5 h-5' />}
						value={
							paste.category === 'none' ? (
								<span>No category</span>
							) : (
								<span className='badge badge-secondary'>
									{getCategoryLabel(paste.category)}
								</span>
							)
						}
					/>
					<PasteDetail
						label='Visibility'
						icon={<FaGlobe className='w-5 h-5' />}
						value={firstLetterUppercase(paste.visibility)}
					/>
					<PasteDetail
						label='Expiration'
						icon={<FaRegHourglassHalf className='w-5 h-5' />}
						value={
							<span className='flex md:flex-row flex-col gap-2'>
								{paste.expiresAt
									? getExpirationLabel(paste.expiration)
									: 'Never Expires'}
								{paste.expiresAt && (
									<span>
										(
										{new Date(
											paste.expiresAt
										).toLocaleString('pl-PL')}
										)
									</span>
								)}
							</span>
						}
					/>
					<PasteDetail
						label='Syntax'
						icon={<FaCode className='w-5 h-5' />}
						value={
							<span
								className='badge font-semibold'
								style={{
									backgroundColor: bgColor,
									color: getContrastTextColor(bgColor)
								}}
							>
								{paste.syntax.name}
							</span>
						}
					/>
					<PasteDetail
						label='Tags'
						icon={<FaTags className='w-5 h-5' />}
						value={
							<div className='flex flex-wrap gap-2'>
								{paste.tags.length
									? paste.tags.map((tag, _index) => (
											<span
												key={tag}
												className='badge badge-accent'
											>
												#{tag}
											</span>
										))
									: 'No tags'}
							</div>
						}
					/>
					<PasteDetail
						label='Password'
						icon={<BsShieldLock className='w-5 h-5' />}
						value={paste.passwordHash ? 'Enabled' : 'Disabled'}
					/>
					<PasteDetail
						label='Created'
						icon={<FaClock className='w-5 h-5' />}
						value={
							<span className='flex md:flex-row flex-col gap-2'>
								{new Date(paste.createdAt).toLocaleString(
									'pl-PL'
								)}
							</span>
						}
					/>
					<PasteDetail
						label='Updated'
						icon={<FaRegEdit className='w-5 h-5' />}
						value={
							<span className='flex md:flex-row flex-col gap-2'>
								{paste.createdAt !== paste.updatedAt ? (
									<span>
										{new Date(
											paste.updatedAt
										).toLocaleString('pl-PL')}
									</span>
								) : (
									'Never updated'
								)}
							</span>
						}
					/>
					<PasteDetail
						label='Hits'
						icon={<FaEye className='w-5 h-5' />}
						value={paste.hits ? paste.hits : '0'}
					/>
				</div>
			</div>
		</>
	)
}

function PasteDetail({
	label,
	value,
	icon
}: {
	label: string
	value: string | React.ReactNode
	icon: React.ReactNode
}) {
	return (
		<div className='bg-base-300 rounded-lg p-5 shadow flex flex-col gap-2'>
			<div className='font-semibold flex items-center gap-2'>
				{icon}
				<span>{label}</span>
			</div>
			<div className='break-words'>{value}</div>
		</div>
	)
}
