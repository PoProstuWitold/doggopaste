import Link from 'next/link'
import { BsShieldLock } from 'react-icons/bs'
import {
	FaClock,
	FaEye,
	FaFolderOpen,
	FaGlobe,
	FaUserAlt
} from 'react-icons/fa'
import type { Paste } from '../types'

interface PasteCardProps {
	paste: Paste
}

export const PasteCard: React.FC<PasteCardProps> = ({ paste }) => {
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
					<span className='badge badge-outline text-xs mt-2 md:mt-0'>
						{paste.syntax}
					</span>
				</div>

				<p className='text-sm text-base-content/60 flex items-center gap-2'>
					<FaClock /> Created:{' '}
					{new Date(paste.createdAt).toLocaleString('pl-PL')}
				</p>

				<div className='flex flex-wrap gap-2 mt-2 text-sm'>
					{paste.category && paste.category !== 'none' && (
						<span className='badge badge-secondary'>
							{paste.category}
						</span>
					)}

					<span className='badge badge-outline'>
						<FaEye className='mr-1' /> {paste.hits} views
					</span>

					<span className='badge badge-outline'>
						<FaGlobe className='mr-1' /> {paste.visibility}
					</span>

					{paste.expiration !== 'never' && (
						<span className='badge badge-outline'>
							⏳ expires: {paste.expiration}
						</span>
					)}

					{paste.folderId && (
						<span className='badge badge-outline'>
							<FaFolderOpen className='mr-1' /> In folder
						</span>
					)}

					{paste.userId ? (
						<span className='badge badge-outline'>
							<FaUserAlt className='mr-1' /> user paste
						</span>
					) : (
						<span className='badge badge-outline'>
							<FaUserAlt className='mr-1' /> guest paste
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
