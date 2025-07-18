'use client'

import { useState } from 'react'
import { FaCheck, FaCopy } from 'react-icons/fa'

export const CopyButton = ({ text }: { text: string }) => {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text)
			setCopied(true)
			setTimeout(() => setCopied(false), 2000)
		} catch (err) {
			console.error('Copy failed', err)
		}
	}

	return (
		<button
			type='button'
			onClick={handleCopy}
			className='btn btn-sm btn-primary'
			title='Copy to clipboard'
		>
			<div className='flex items-center gap-1 font-extrabold'>
				Copy{' '}
				{copied ? <FaCheck className='text-success' /> : <FaCopy />}
			</div>
		</button>
	)
}
