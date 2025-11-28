'use client'

import CodeMirror from '@uiw/react-codemirror'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { BiCategory } from 'react-icons/bi'
import { BsShieldLock } from 'react-icons/bs'
import {
	FaClock,
	FaCode,
	FaEye,
	FaFileCode,
	FaFire,
	FaFolder,
	FaGlobe,
	FaInfoCircle,
	FaLock,
	FaRegEdit,
	FaTags,
	FaUnlock,
	FaUser
} from 'react-icons/fa'
import { FaRegHourglassHalf, FaXmark } from 'react-icons/fa6'
import { FiHash } from 'react-icons/fi'
import { MdEnhancedEncryption } from 'react-icons/md'
import { useTheme } from '../../context/ThemeContext'
import type { Paste, User } from '../../types'
import {
	extensions,
	firstLetterUppercase,
	getBaseApiUrl,
	getCategoryLabel,
	getContrastTextColor,
	getExpirationLabel
} from '../../utils/functions'
import { decryptWithPassword } from '../../utils/webCrypto'
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
	const [isServerLocked, setIsServerLocked] = useState(
		!!paste.passwordHash && !paste.content
	)
	const [isClientLocked, setIsClientLocked] = useState(paste.encrypted)
	const [fetchedContent, setFetchedContent] = useState<string>(paste.content)
	const [decryptedContent, setDecryptedContent] = useState<string | null>(
		null
	)

	const [passwordInput, setPasswordInput] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)

	const handleUnlock = async (e?: React.FormEvent) => {
		if (e) e.preventDefault()
		if (!passwordInput) return

		setIsProcessing(true)

		try {
			if (isServerLocked) {
				const res = await fetch(
					`${getBaseApiUrl()}/api/pastes/${slug}/verify`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ password: passwordInput })
					}
				)

				const json = await res.json()

				if (!res.ok) {
					throw new Error(json.message || 'Invalid server password')
				}

				const realContent = json.content
				setFetchedContent(realContent)
				setIsServerLocked(false)
				toast.success('Server password verified!')

				if (paste.encrypted) {
					try {
						const clearText = await decryptWithPassword(
							realContent,
							passwordInput
						)
						setDecryptedContent(clearText)
						setIsClientLocked(false)
						toast.success(
							'Client encryption unlocked automatically!'
						)
					} catch {
						setPasswordInput('')
						toast(
							'Server unlocked. Please enter encryption password.'
						)
					}
				}
			} else if (isClientLocked) {
				const clearText = await decryptWithPassword(
					fetchedContent,
					passwordInput
				)
				setDecryptedContent(clearText)
				setIsClientLocked(false)
				toast.success('Content decrypted successfully!')
			}
		} catch (error) {
			console.error(error)
			toast.error((error as Error).message || 'Unlock failed')
			if (!isServerLocked) setPasswordInput('')
		} finally {
			setIsProcessing(false)
		}
	}

	const contentToDisplay = paste.encrypted
		? decryptedContent || ''
		: fetchedContent

	const showLockScreen = isServerLocked || isClientLocked

	return (
		<div className='mb-20'>
			{/* Warning Burn After Read */}
			{showWarning && (
				<div className='alert alert-error shadow-lg mb-4 max-w-7xl mx-auto relative'>
					<button
						className='absolute top-2 right-2 text-xl font-bold text-error-content hover:text-white transition-colors'
						onClick={() => setShowWarning(false)}
						aria-label='Close warning'
						type='button'
					>
						<FaXmark className='w-5 h-5' />
					</button>
					<div className='flex items-start md:items-center gap-3 pr-6'>
						<FaFire className='w-6 h-6 shrink-0 animate-pulse' />
						<div>
							{isServerLocked || isClientLocked ? (
								<span>
									<span className='font-black uppercase'>
										Burn After Read:
									</span>{' '}
									This paste is set to self-destruct. It will
									be{' '}
									<strong>
										permanently deleted from the server
										immediately after you unlock it
									</strong>
									. Make sure to write the content down once
									unlocked.
								</span>
							) : (
								<span>
									<span className='font-black uppercase'>
										Data Vanished:
									</span>{' '}
									This paste was in <i>"Burn After Read"</i>{' '}
									mode. It has been displayed once and{' '}
									<strong>
										no longer exists on the server
									</strong>
									. If you refresh this page or close the tab,
									the content will be lost forever.
								</span>
							)}
						</div>
					</div>
				</div>
			)}

			<div className='flex flex-col gap-4 p-5 rounded-lg bg-base-200 mx-auto max-w-8xl'>
				<div className='flex lg:flex-row flex-col items-center font-bold text-center gap-4 justify-center'>
					<div className='flex flex-row items-center text-2xl font-bold text-center gap-4 justify-center'>
						<FaFileCode className='w-7 h-7' />
						Static Paste "{paste.slug}"
					</div>
					<div className='divider lg:divider-horizontal' />
					<PasteButtons
						paste={paste}
						user={user}
						decryptedContent={decryptedContent}
						passwordInput={!isServerLocked ? passwordInput : ''}
						isLocked={isServerLocked || isClientLocked}
						content={contentToDisplay}
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
						<div className='form-control w-full flex-1 min-w-0 relative'>
							<div className='label'>
								<span className='label-text'>Content</span>
							</div>
							{showLockScreen ? (
								<div className='h-[400px] bg-base-300 rounded-lg flex flex-col items-center justify-center gap-4 border-2 border-base-content/10'>
									{isServerLocked ? (
										<BsShieldLock className='w-16 h-16 text-warning' />
									) : (
										<MdEnhancedEncryption className='w-16 h-16 text-primary' />
									)}

									<div className='text-center'>
										<h3 className='text-xl font-bold'>
											{isServerLocked
												? 'Server Password Protected'
												: 'Client Encrypted Content'}
										</h3>
										<p className='text-sm opacity-70'>
											{isServerLocked
												? 'This paste is protected by a server-side password.'
												: 'This paste is encrypted locally.'}
										</p>
									</div>

									<form
										onSubmit={handleUnlock}
										className='flex gap-2 items-center mt-2'
									>
										<input
											type='password'
											placeholder={
												isServerLocked
													? 'Enter server password...'
													: 'Enter decryption password...'
											}
											className='input input-bordered w-full max-w-lg'
											value={passwordInput}
											onChange={(e) =>
												setPasswordInput(e.target.value)
											}
										/>
										<button
											type='submit'
											className={`btn ${isServerLocked ? 'btn-warning' : 'btn-primary'}`}
											disabled={
												!passwordInput || isProcessing
											}
										>
											{isProcessing ? (
												<span className='loading loading-spinner loading-xs'></span>
											) : (
												<>
													Unlock <FaUnlock />
												</>
											)}
										</button>
									</form>
								</div>
							) : (
								<div className='min-w-0'>
									<CodeMirror
										value={contentToDisplay}
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
							)}
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
				<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
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
						label='Hits'
						icon={<FaEye className='w-5 h-5' />}
						value={paste.hits ? paste.hits : '0'}
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
						label='Guest Paste'
						icon={<FaUser className='w-5 h-5' />}
						value={paste.userId ? 'No' : 'Yes'}
					/>
					<PasteDetail
						label='Folder'
						icon={<FaFolder className='w-5 h-5' />}
						value={paste.folderId ? 'In a folder' : 'No folder'}
					/>
					<PasteDetail
						label='Length'
						icon={<FiHash className='w-5 h-5' />}
						value={
							showLockScreen
								? 'Hidden'
								: contentToDisplay.length + ' characters'
						}
					/>
					<PasteDetail
						label='Password'
						icon={<BsShieldLock className='w-5 h-5' />}
						value={
							paste.passwordHash ? (
								isServerLocked ? (
									<span className='text-error font-bold flex gap-1 items-center'>
										Locked <FaLock />
									</span>
								) : (
									<span className='text-success font-bold flex gap-1 items-center'>
										Unlocked <FaUnlock />
									</span>
								)
							) : (
								'Disabled'
							)
						}
					/>
					<PasteDetail
						label='Encrypted'
						icon={<MdEnhancedEncryption className='w-5 h-5' />}
						value={
							paste.encrypted ? (
								isClientLocked ? (
									<span className='text-error font-bold flex gap-1 items-center'>
										Locked <FaLock />
									</span>
								) : (
									<span className='text-success font-bold flex gap-1 items-center'>
										Unlocked <FaUnlock />
									</span>
								)
							) : (
								'No'
							)
						}
					/>
					<PasteDetail
						className='col-span-full'
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
				</div>
			</div>
		</div>
	)
}

function PasteDetail({
	label,
	value,
	icon,
	className
}: {
	label: string
	value: string | React.ReactNode
	icon: React.ReactNode
	className?: string
}) {
	return (
		<div
			className={`p-4 rounded-lg bg-base-300 flex flex-col gap-2 ${className}`}
		>
			<div className='font-semibold flex items-center gap-2'>
				{icon}
				<span>{label}</span>
			</div>
			<div className='break-words'>{value}</div>
		</div>
	)
}
