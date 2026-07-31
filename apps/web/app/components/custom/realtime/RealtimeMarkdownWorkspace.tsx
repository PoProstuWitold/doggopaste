'use client'

import type { RefObject } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaCode, FaColumns, FaEye, FaLink, FaUnlink } from 'react-icons/fa'
import { createSafeMarkdownHtml } from '../MarkdownPreview'

type MarkdownMode = 'code' | 'split' | 'preview'

const getScrollableElement = (container: HTMLElement): HTMLElement => {
	const isScrollable = (element: HTMLElement) =>
		element.scrollHeight > element.clientHeight

	if (isScrollable(container)) return container

	const codeMirrorScroller =
		container.querySelector<HTMLElement>('.cm-scroller')
	if (codeMirrorScroller && isScrollable(codeMirrorScroller)) {
		return codeMirrorScroller
	}

	return codeMirrorScroller ?? container
}

export const RealtimeMarkdownWorkspace = ({
	content,
	isMarkdown,
	editorContainerRef
}: {
	content: string
	isMarkdown: boolean
	editorContainerRef: RefObject<HTMLDivElement | null>
}) => {
	const [mode, setMode] = useState<MarkdownMode>('code')
	const [syncEnabled, setSyncEnabled] = useState(false)
	const [previewContent, setPreviewContent] = useState(content)
	const codeScrollRef = useRef<HTMLDivElement>(null)
	const previewRef = useRef<HTMLDivElement>(null)
	const detachSyncRef = useRef<(() => void) | null>(null)
	const showCode = !isMarkdown || mode === 'code' || mode === 'split'
	const showPreview = isMarkdown && (mode === 'split' || mode === 'preview')

	useEffect(() => {
		if (!showPreview) return
		const timeout = window.setTimeout(() => setPreviewContent(content), 150)
		return () => window.clearTimeout(timeout)
	}, [content, showPreview])

	const renderedMarkdownHtml = useMemo(
		() => (showPreview ? createSafeMarkdownHtml(previewContent) : ''),
		[previewContent, showPreview]
	)

	const detachSync = useCallback(() => {
		detachSyncRef.current?.()
		detachSyncRef.current = null
		setSyncEnabled(false)
	}, [])

	useEffect(
		() => () => {
			detachSyncRef.current?.()
			detachSyncRef.current = null
		},
		[]
	)

	useEffect(() => {
		if (!isMarkdown) {
			detachSync()
			setMode('code')
		}
	}, [detachSync, isMarkdown])

	useEffect(() => {
		if (mode !== 'split' && detachSyncRef.current) detachSync()
	}, [detachSync, mode])

	const toggleSync = () => {
		if (syncEnabled) {
			detachSync()
			return
		}
		if (!previewRef.current || !codeScrollRef.current) return

		const codeElement = getScrollableElement(codeScrollRef.current)
		const previewElement = previewRef.current
		let activeSource: 'code' | 'preview' | null = null

		const syncScroll = (source: HTMLElement, target: HTMLElement) => {
			const sourceRange = source.scrollHeight - source.clientHeight
			const targetRange = target.scrollHeight - target.clientHeight
			if (sourceRange <= 0 || targetRange <= 0) return

			const ratio = Math.max(
				0,
				Math.min(1, source.scrollTop / sourceRange)
			)
			target.scrollTop = ratio * targetRange
		}

		const handleCodeScroll = () => {
			if (activeSource === 'preview') return
			activeSource = 'code'
			syncScroll(codeElement, previewElement)
			activeSource = null
		}
		const handlePreviewScroll = () => {
			if (activeSource === 'code') return
			activeSource = 'preview'
			syncScroll(previewElement, codeElement)
			activeSource = null
		}

		codeElement.addEventListener('scroll', handleCodeScroll, {
			passive: true
		})
		previewElement.addEventListener('scroll', handlePreviewScroll, {
			passive: true
		})
		detachSyncRef.current = () => {
			codeElement.removeEventListener('scroll', handleCodeScroll)
			previewElement.removeEventListener('scroll', handlePreviewScroll)
		}
		setSyncEnabled(true)
		requestAnimationFrame(() => syncScroll(codeElement, previewElement))
	}

	return (
		<>
			{isMarkdown && (
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
							onClick={toggleSync}
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
			)}

			<div
				className={`flex gap-4 ${showPreview && showCode ? 'flex-col lg:flex-row' : 'flex-col'}`}
			>
				<div
					ref={codeScrollRef}
					className={`rounded-lg bg-base-300/80 overflow-auto transition-all ${showPreview && showCode ? 'w-full lg:w-1/2' : 'w-full'} ${
						showCode
							? 'max-h-100 md:max-h-150 lg:max-h-200'
							: 'h-0 max-h-0 border-none p-0'
					}`}
				>
					<div ref={editorContainerRef} className='min-h-75' />
				</div>
				{showPreview && (
					<div
						ref={previewRef}
						className={`rounded-lg border border-dashed border-base-300 bg-base-100/90 dark:bg-base-200/90 overflow-auto max-h-100 md:max-h-150 lg:max-h-200 p-4 ${showCode ? 'w-full lg:w-1/2' : 'w-full'}`}
					>
						<div
							className='markdown-preview'
							// biome-ignore lint/security/noDangerouslySetInnerHtml: createSafeMarkdownHtml sanitizes with DOMPurify
							dangerouslySetInnerHTML={{
								__html: renderedMarkdownHtml
							}}
						/>
					</div>
				)}
			</div>
		</>
	)
}
