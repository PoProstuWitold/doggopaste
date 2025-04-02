'use client'

import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import Link from 'next/link'
import { BsFiletypeRaw } from 'react-icons/bs'
import { FaCodeFork, FaCopy } from 'react-icons/fa6'
import { ImEmbed2 } from 'react-icons/im'
import { MdDelete, MdDownload, MdEdit } from 'react-icons/md'
import { CustomDialog } from './CustomDialog'

export const PasteButtons = ({ slug }: { slug: string }) => {
	const router = useRouter()

	const handleDeletePaste = async () => {
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_HONO_API_URL}/api/pastes/${slug}`,
				{
					method: 'DELETE',
					credentials: 'include'
				}
			)
			const json = await res.json()

			if (res.ok) {
				toast.success(json.message || 'Paste deleted!')
				router.push('/')
				router.refresh()
			} else {
				toast.error(json.message || 'Failed to delete paste')
			}
		} catch (err) {
			toast.error('Something went wrong while deleting')
		}
	}

	return (
		<div className='flex flex-wrap gap-2 justify-center'>
			<button type='button' className='btn btn-sm btn-primary'>
				<div className='flex items-center gap-1 font-extrabold'>
					Copy <FaCopy />
				</div>
			</button>
			<Link href={`/p/${slug}/raw`} className='btn btn-sm btn-warning'>
				<div className='flex items-center gap-1 font-extrabold'>
					Raw <BsFiletypeRaw />
				</div>
			</Link>
			<button type='button' className='btn btn-sm btn-success'>
				<div className='flex items-center gap-1 font-extrabold'>
					Download <MdDownload />
				</div>
			</button>
			<button type='button' className='btn btn-sm btn-info'>
				<div className='flex items-center gap-1 font-extrabold'>
					Embed <ImEmbed2 />
				</div>
			</button>
			<Link href={`/p/${slug}/fork`} className='btn btn-sm btn-secondary'>
				<div className='flex items-center gap-1 font-extrabold'>
					Fork <FaCodeFork />
				</div>
			</Link>
			<Link href={`/p/${slug}/edit`} className='btn btn-sm btn-accent'>
				<div className='flex items-center gap-1 font-extrabold'>
					Edit <MdEdit />
				</div>
			</Link>
			<CustomDialog
				btnContent={
					<div className='flex items-center gap-1 font-extrabold'>
						Delete <MdDelete />
					</div>
				}
				btnClasses='btn btn-sm btn-error'
				title='Delete this paste?'
				description='This action is irreversible. Are you sure you want to permanently delete this paste?'
			>
				<div className='flex justify-end gap-2'>
					<button
						className='btn btn-error'
						onClick={handleDeletePaste}
						type='button'
					>
						Delete
					</button>
				</div>
			</CustomDialog>
		</div>
	)
}
