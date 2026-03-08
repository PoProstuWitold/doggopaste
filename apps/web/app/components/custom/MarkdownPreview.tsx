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

	const disableSyncScroll = () => {
		if (detachSyncRef.current) {
			detachSyncRef.current()
			detachSyncRef.current = null
		}
		setSyncEnabled(false)
	}

	const changeMode = (nextMode: MarkdownViewMode) => {
		if (nextMode !== 'split') {
			disableSyncScroll()
		}
		setMode(nextMode)
	}

	useEffect(() => {
		return () => {
			if (detachSyncRef.current) {
				detachSyncRef.current()
				detachSyncRef.current = null
			}
		}
	}, [])

	useEffect(() => {
		if (mode !== 'split') {
			disableSyncScroll()
		}
	}, [mode])

	const getScrollableElement = (container: HTMLElement): HTMLElement => {
		// In static paste the wrapper has overflow-auto + max-h; CodeMirror may scroll inside .cm-scroller.
		// Use whichever element actually has scrollable overflow.
		const isScrollable = (el: HTMLElement) =>
			el.scrollHeight > el.clientHeight

		if (isScrollable(container)) return container

		const cmScroller = container.querySelector('.cm-scroller') as HTMLElement | null
		if (cmScroller && isScrollable(cmScroller)) return cmScroller

		// Fallback: prefer .cm-scroller if present (it's the one user usually scrolls in CodeMirror)
		return cmScroller ?? container
	}

	const syncScroll = (source: HTMLElement, target: HTMLElement) => {
		const sourceScrollable = source.scrollHeight - source.clientHeight
		const targetScrollable = target.scrollHeight - target.clientHeight

		if (sourceScrollable <= 0) return
		// If target has no scroll range, nothing to sync
		if (targetScrollable <= 0) return

		const ratio = Math.max(0, Math.min(1, source.scrollTop / sourceScrollable))
		target.scrollTop = ratio * targetScrollable
	}

	const toggleSyncScroll = () => {
		if (syncEnabled) {
			disableSyncScroll()
			return
		}

		if (!codeRef.current || !previewRef.current) return

		const codeEl = getScrollableElement(codeRef.current)
		const previewEl = previewRef.current

		let active: 'code' | 'preview' | null = null

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

		codeEl.addEventListener('scroll', handleCodeScroll, { passive: true })
		previewEl.addEventListener('scroll', handlePreviewScroll, { passive: true })

		detachSyncRef.current = () => {
			codeEl.removeEventListener('scroll', handleCodeScroll)
			previewEl.removeEventListener('scroll', handlePreviewScroll)
		}

		setSyncEnabled(true)

		// od razu wyrównaj preview do aktualnej pozycji kodu
		requestAnimationFrame(() => {
			syncScroll(codeEl, previewEl)
		})
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
						onClick={() => changeMode('code')}
						title='Show Markdown source only'
					>
						<FaCode className='w-3 h-3 sm:w-4 sm:h-4' />
						<span className='hidden sm:inline'>Code</span>
					</button>
					<button
						type='button'
						className={`btn btn-xs sm:btn-sm join-item ${mode === 'split' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => changeMode('split')}
						title='Show code and preview side by side'
					>
						<FaColumns className='w-3 h-3 sm:w-4 sm:h-4' />
						<span className='hidden sm:inline'>Split</span>
					</button>
					<button
						type='button'
						className={`btn btn-xs sm:btn-sm join-item ${mode === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
						onClick={() => changeMode('preview')}
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
								<span className='hidden sm:inline'>Unsync</span>
							</>
						) : (
							<>
								<FaLink className='w-3 h-3 sm:w-4 sm:h-4' />
								<span className='hidden sm:inline'>Sync scroll</span>
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
							className='markdown-preview'
							dangerouslySetInnerHTML={{ __html: renderedHtml }}
						/>
					</div>
				)}
			</div>
		</div>
	)
}