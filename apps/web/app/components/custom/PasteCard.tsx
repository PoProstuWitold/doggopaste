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
import { MdEnhancedEncryption } from 'react-icons/md'
import type { PasteSummary } from '../../types'
import {
	firstLetterUppercase,
	getCategoryLabel,
	getContrastTextColor,
	getExpirationLabel
} from '../../utils/functions'

interface PasteCardProps {
	paste: PasteSummary
}

export const PasteCard: React.FC<PasteCardProps> = ({ paste }) => {
	const bgColor = paste.syntax.color

	return (
		<li
			key={paste.id}
			className='card min-w-0 overflow-hidden border border-base-300 bg-base-100 transition-colors hover:border-primary/40'
		>
			<div className='card-body min-w-0 gap-3 p-4 sm:p-5'>
				<div className='flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
					<Link
						href={`/p/${paste.slug}`}
						className='min-w-0 break-words text-lg font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:max-w-[75%]'
						title={paste.title}
					>
						{paste.title || '(Untitled)'}
					</Link>
					<span
						className='badge max-w-full shrink-0 self-start font-semibold'
						style={{
							backgroundColor: bgColor,
							color: getContrastTextColor(bgColor)
						}}
					>
						{paste.syntax.name}
					</span>
				</div>
				<p className='flex w-full min-w-0 items-center gap-2 text-sm text-base-content/80 sm:text-base'>
					<span className='block min-w-0 break-words'>
						{paste.description || '(No description)'}
					</span>
				</p>
				<p className='flex flex-wrap items-center gap-2 text-sm text-base-content/60'>
					<FaClock aria-hidden='true' /> Created:{' '}
					{new Date(paste.createdAt).toLocaleString('pl-PL')}
				</p>
				{paste.createdAt !== paste.updatedAt && (
					<p className='flex flex-wrap items-center gap-2 text-sm text-base-content/60'>
						<FaRegEdit aria-hidden='true' /> Edited:{' '}
						{new Date(paste.updatedAt).toLocaleString('pl-PL')}
					</p>
				)}

				<div className='mt-1 flex min-w-0 flex-wrap gap-2 text-sm'>
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

					{paste.folderId && paste.folderName && (
						<span
							className='badge badge-outline h-auto max-w-full min-w-0 gap-1 py-1'
							title={paste.folderName}
						>
							<FaFolderOpen
								className='shrink-0'
								aria-hidden='true'
							/>
							<span className='min-w-0 truncate'>
								{paste.folderName}
							</span>
						</span>
					)}

					{paste.userId && paste.userName ? (
						<span
							className='badge badge-outline h-auto max-w-full min-w-0 gap-1 py-1'
							title={`User: ${paste.userName}`}
						>
							<FaUserAlt
								className='shrink-0'
								aria-hidden='true'
							/>
							<span className='min-w-0 truncate'>
								User: {paste.userName}
							</span>
						</span>
					) : !paste.userId ? (
						<span className='badge badge-outline'>
							<FaUserAlt className='mr-1' aria-hidden='true' />{' '}
							Guest Paste
						</span>
					) : null}

					{paste.passwordProtected && (
						<span className='badge badge-warning'>
							<BsShieldLock className='mr-1' /> Password Protected
						</span>
					)}
					{paste.encrypted && (
						<span className='badge badge-error'>
							<MdEnhancedEncryption /> Encrypted
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
