'use client'

import Link from 'next/link'
import { BsFiletypeRaw } from 'react-icons/bs'
import { FaCodeFork, FaCopy } from 'react-icons/fa6'
import { ImEmbed2 } from 'react-icons/im'
import { MdDownload, MdEdit } from 'react-icons/md'

export const PasteButtons = ({ slug }: { slug: string }) => {
	return (
		<div className='flex flex-wrap gap-2 justify-center'>
			<button type='button' className='btn btn-sm btn-primary'>
				<div className='flex items-center gap-1 font-extrabold'>
					Copy <FaCopy />
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

			<Link href={`/p/${slug}/raw`} className='btn btn-sm btn-warning'>
				<div className='flex items-center gap-1 font-extrabold'>
					Raw <BsFiletypeRaw />
				</div>
			</Link>
			<button type='button' className='btn btn-sm btn-info'>
				<div className='flex items-center gap-1 font-extrabold'>
					Embed <ImEmbed2 />
				</div>
			</button>
			<button type='button' className='btn btn-sm btn-success'>
				<div className='flex items-center gap-1 font-extrabold'>
					Download <MdDownload />
				</div>
			</button>
		</div>
	)
}
