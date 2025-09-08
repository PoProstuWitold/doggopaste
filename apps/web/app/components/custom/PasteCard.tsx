import Link from 'next/link'
import { BiCategory } from 'react-icons/bi'
import { BsShieldLock } from 'react-icons/bs'
import {
	FaClock,
	FaEye,
	FaFolderOpen,
	FaGlobe,
	FaRegEdit,
	FaUserAlt
} from 'react-icons/fa'
import { FaRegHourglassHalf } from 'react-icons/fa6'
import type { Paste } from '../../types'
import {
	firstLetterUppercase,
	getCategoryLabel,
	getContrastTextColor,
	getExpirationLabel
} from '../../utils/functions'

interface PasteCardProps {
	paste: Paste
}

export const PasteCard: React.FC<PasteCardProps> = ({ paste }) => {
	const bgColor = paste.syntax.color

	return (
		<li
			key={paste.id}
			className='card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-all'
		>
			<div className='card-body px-6 py-4 gap-2'>
				<div className='flex flex-col md:flex-row md:justify-between md:items-center'>
					<Link
						href={`/p/${paste.slug}`}
						className='text-lg font-semibold text-primary hover:underline truncate max-w-full md:max-w-[70%]'
						title={paste.title}
					>
						{paste.title || '(Untitled)'}
					</Link>
					<span
						className='badge mt-2 md:mt-0 font-semibold'
						style={{
							backgroundColor: bgColor,
							color: getContrastTextColor(bgColor)
						}}
					>
						{paste.syntax.name}
					</span>
				</div>
				<p className='text-md flex items-center gap-2 w-full'>
					<span className='truncate block min-w-0'>
						{paste.description || '(No description)'}
					</span>
				</p>
				<p className='text-sm text-base-content/60 flex items-center gap-2'>
					<FaClock /> Created:{' '}
					{new Date(paste.createdAt).toLocaleString('pl-PL')}
				</p>
				{paste.createdAt !== paste.updatedAt && (
					<p className='text-sm text-base-content/60 flex items-center gap-2'>
						<FaRegEdit /> Edited:{' '}
						{new Date(paste.updatedAt).toLocaleString('pl-PL')}
					</p>
				)}

				<div className='flex flex-wrap gap-2 mt-2 text-sm'>
					{paste.category && paste.category !== 'none' && (
						<span className='badge badge-secondary'>
							<BiCategory /> {getCategoryLabel(paste.category)}
						</span>
					)}

					<span className='badge badge-outline'>
						<FaEye className='mr-1' /> {paste.hits} Hits
					</span>

					<span className='badge badge-outline'>
						<FaGlobe className='mr-1' />{' '}
						{firstLetterUppercase(paste.visibility)}
					</span>

					{paste.expiration !== 'never' && (
						<span className='badge badge-outline'>
							<FaRegHourglassHalf /> Expiration:{' '}
							{getExpirationLabel(paste.expiration)}
						</span>
					)}

					{paste.folderId && (
						<span className='badge badge-outline'>
							<FaFolderOpen className='mr-1' /> In folder
						</span>
					)}

					{paste.userId ? (
						<span className='badge badge-outline'>
							<FaUserAlt className='mr-1' /> User Paste
						</span>
					) : (
						<span className='badge badge-outline'>
							<FaUserAlt className='mr-1' /> Guest Paste
						</span>
					)}

					{paste.passwordHash && (
						<span className='badge badge-error'>
							<BsShieldLock className='mr-1' /> password protected
						</span>
					)}
				</div>

				{paste.tags?.length > 0 && (
					<div className='flex flex-wrap gap-2 mt-2'>
						{paste.tags.map((tag) => (
							<span key={tag} className='badge badge-accent'>
								#{tag}
							</span>
						))}
					</div>
				)}
			</div>
		</li>
	)
}
