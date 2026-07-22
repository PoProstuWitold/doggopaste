import { BiCategory } from 'react-icons/bi'
import { BsShieldLock } from 'react-icons/bs'
import {
	FaClock,
	FaCode,
	FaEye,
	FaFolder,
	FaGlobe,
	FaInfoCircle,
	FaLock,
	FaRegEdit,
	FaTags,
	FaUnlock,
	FaUser
} from 'react-icons/fa'
import { FaRegHourglassHalf } from 'react-icons/fa6'
import { FiHash } from 'react-icons/fi'
import { MdEnhancedEncryption } from 'react-icons/md'
import type { Paste } from '../../../types'
import {
	firstLetterUppercase,
	getCategoryLabel,
	getContrastTextColor,
	getExpirationLabel
} from '../../../utils/functions'

export function PasteMetadata({
	content,
	isClientLocked,
	isServerLocked,
	paste,
	showLockScreen
}: {
	content: string
	isClientLocked: boolean
	isServerLocked: boolean
	paste: Paste
	showLockScreen: boolean
}) {
	const bgColor = paste.syntax.color

	return (
		<>
			<div className='divider ' />
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
							{new Date(paste.createdAt).toLocaleString('pl-PL')}
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
									{new Date(paste.updatedAt).toLocaleString(
										'pl-PL'
									)}
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
									{new Date(paste.expiresAt).toLocaleString(
										'pl-PL'
									)}
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
							: `${content.length} characters`
					}
				/>
				<PasteDetail
					label='Password'
					icon={<BsShieldLock className='w-5 h-5' />}
					value={
						paste.passwordProtected ? (
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
								? paste.tags.map((tag) => (
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
		</>
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
			<div className='wrap-break-word'>{value}</div>
		</div>
	)
}
