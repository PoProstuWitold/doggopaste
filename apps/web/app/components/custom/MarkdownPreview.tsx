'use client'

import DOMPurify from 'dompurify'
import { marked } from 'marked'
import {
	FaCode,
	FaColumns,
	FaEye,
	FaLink,
	FaUnlink
} from 'react-icons/fa'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type MarkdownViewMode = 'code' | 'preview' | 'split'

interface MarkdownPreviewProps {
	markdown: string
	children: ReactNode
}

export const createSafeMarkdownHtml = (markdown: string): string => {
	const rawHtml = marked.parse(markdown || '', {
		gfm: true,
		breaks: true
	}) as string

	if (typeof window === 'undefined') {
		return rawHtml
	}

	return DOMPurify.sanitize(rawHtml)
}

export function MarkdownPreview({ markdown, children }: MarkdownPreviewProps) {
	const [mode, setMode] = useState<MarkdownViewMode>('code')
	const [syncEnabled, setSyncEnabled] = useState(false)

	const codeRef = useRef<HTMLDivElement | null>(null)
	const previewRef = useRef<HTMLDivElement | null>(null)
	const detachSyncRef = useRef<(() => void) | null>(null)

	const renderedHtml = useMemo(
		() => createSafeMarkdownHtml(markdown),
		[markdown]
	)

	useEffect(() => {
		return () => {
			if (detachSyncRef.current) {
				detachSyncRef.current()
			}
		}
	}, [])

	const toggleSyncScroll = () => {
		if (syncEnabled) {
			if (detachSyncRef.current) {
				detachSyncRef.current()
				detachSyncRef.current = null
			}
			setSyncEnabled(false)
			return
		}

		if (!codeRef.current || !previewRef.current) return

		const codeEl = codeRef.current
		const previewEl = previewRef.current

		let active: 'code' | 'preview' | null = null

		const syncScroll = (source: HTMLElement, target: HTMLElement) => {
			const sourceScrollHeight =
				source.scrollHeight - source.clientHeight || 1
			const targetScrollHeight =
				target.scrollHeight - target.clientHeight || 1

			const ratio = source.scrollTop / sourceScrollHeight
			target.scrollTop = ratio * targetScrollHeight
		}

		const handleCodeScroll = () => {
			if (active === 'preview') return
			active = 'code'
			syncScroll(codeEl, previewEl)
			active = null
		}

		const handlePreviewScroll = () => {
			if (active === 'code') return
			active = 'preview'
			syncScroll(previewEl, codeEl)
			active = null
		}

		codeEl.addEventListener('scroll', handleCodeScroll)
		previewEl.addEventListener('scroll', handlePreviewScroll)

		detachSyncRef.current = () => {
			codeEl.removeEventListener('scroll', handleCodeScroll)
			previewEl.removeEventListener('scroll', handlePreviewScroll)
		}

		setSyncEnabled(true)
	}

	const showCode = mode === 'code' || mode === 'split'
	const showPreview = mode === 'preview' || mode === 'split'

	return (
		<div className='flex flex-col gap-3'>
			<div className='flex items-center justify-between gap-2'>
				<div className='join'>
					<button
						type='button'
						className={`btn btn-xs sm:btn-sm join-item ${mode === 'code' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => setMode('code')}
						title='Show Markdown source only'
					>
						<FaCode className='w-3 h-3 sm:w-4 sm:h-4' />
						<span className='hidden sm:inline'>Code</span>
					</button>
					<button
						type='button'
						className={`btn btn-xs sm:btn-sm join-item ${mode === 'split' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => setMode('split')}
						title='Show code and preview side by side'
					>
						<FaColumns className='w-3 h-3 sm:w-4 sm:h-4' />
						<span className='hidden sm:inline'>Split</span>
					</button>
					<button
						type='button'
						className={`btn btn-xs sm:btn-sm join-item ${mode === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => setMode('preview')}
						title='Show rendered preview only'
					>
						<FaEye className='w-3 h-3 sm:w-4 sm:h-4' />
						<span className='hidden sm:inline'>Preview</span>
					</button>
				</div>

				{mode === 'split' && (
					<button
						type='button'
						className={`btn btn-xs sm:btn-sm btn-outline ${syncEnabled ? 'btn-success' : 'btn-ghost'}`}
						onClick={toggleSyncScroll}
						title='Toggle scroll sync between code and preview'
					>
						{syncEnabled ? (
							<>
								<FaUnlink className='w-3 h-3 sm:w-4 sm:h-4' />
								<span className='hidden sm:inline'>
									Unsync
								</span>
							</>
						) : (
							<>
								<FaLink className='w-3 h-3 sm:w-4 sm:h-4' />
								<span className='hidden sm:inline'>
									Sync scroll
								</span>
							</>
						)}
					</button>
				)}
			</div>

			<div
				className={`flex gap-4 ${mode === 'split' ? 'flex-col lg:flex-row' : 'flex-col'}`}
			>
				{showCode && (
					<div
						ref={codeRef}
						className={`rounded-lg bg-base-300/80 overflow-auto max-h-[650px] ${mode === 'split' ? 'w-full lg:w-1/2' : 'w-full'}`}
					>
						{children}
					</div>
				)}
				{showPreview && (
					<div
						ref={previewRef}
						className={`rounded-lg border border-dashed border-base-300 bg-base-100/90 dark:bg-base-200/90 overflow-auto max-h-[650px] p-4 ${mode === 'split' ? 'w-full lg:w-1/2' : 'w-full'}`}
					>
						<div
							className='prose prose-sm max-w-none dark:prose-invert'
							// eslint-disable-next-line react/no-danger
							dangerouslySetInnerHTML={{ __html: renderedHtml }}
						/>
					</div>
				)}
			</div>
		</div>
	)
}

