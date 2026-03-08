'use client'

import { indentWithTab } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { EditorState, StateEffect } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { basicSetup, EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import { FaBolt, FaLink, FaUnlink } from 'react-icons/fa'
import io, { type Socket } from 'socket.io-client'
import { useTheme } from '../../context/ThemeContext'
import type { RealtimePaste, Session, User } from '../../types'
import {
	extensions,
	getBaseApiUrl,
	getContrastTextColor
} from '../../utils/functions'
import { RealtimeCursors } from './RealtimeCursors'
import { RealtimePasteButtons } from './RealtimePasteButtons'
import { createSafeMarkdownHtml } from './MarkdownPreview'

export const RealtimeEditor = ({
	slug,
	realtimePaste,
	session
}: {
	slug: string
	realtimePaste: RealtimePaste
	session?: {
		session: Session | null
		user: User
	}
}) => {
	const { cmTheme } = useTheme()
	const [title, setTitle] = useState(realtimePaste.title || '')
	const [content, setContent] = useState(realtimePaste.content || '')
	const [selectedSyntax, setSelectedSyntax] = useState(
		realtimePaste.syntax ?? { name: 'Plaintext' }
	)

	const editorRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<EditorView | null>(null)
	const socket = useRef<Socket | null>(null)
	const socketId = useRef<string | null>(null)
	const isRemoteChange = useRef(false)

	const [markdownMode, setMarkdownMode] = useState<'code' | 'split' | 'preview'>('code')
	const [markdownSyncEnabled, setMarkdownSyncEnabled] = useState(false)
	const codeScrollRef = useRef<HTMLDivElement | null>(null)
	const previewRef = useRef<HTMLDivElement | null>(null)
	const detachSyncRef = useRef<(() => void) | null>(null)

	const scrollTheme = EditorView.theme({
		'&': {
			maxHeight: '600px',
			overflow: 'auto'
		}
	})
	const createEditorExtensions = () => [
		basicSetup,
		indentUnit.of('    '),
		keymap.of([indentWithTab]),
		extensions[selectedSyntax.name as keyof typeof extensions],
		cmTheme,
		scrollTheme,
		EditorView.updateListener.of((update) => {
			if (update.docChanged) {
				setContent(update.state.doc.toString())
			}
			if (isRemoteChange.current) {
				isRemoteChange.current = false
				return
			}
			if (update.docChanged && socketId.current) {
				update.changes.iterChanges(
					(fromA, toA, _fromB, _toB, inserted) => {
						socket.current?.emit('code-change', {
							from: fromA,
							to: toA,
							insert: inserted.toString(),
							sender: socketId.current,
							slug
						})
					}
				)
			}
		})
	]

	// Init socket
	useEffect(() => {
		const s = io(getBaseApiUrl(), { path: '/ws', withCredentials: true })
		socket.current = s

		s.on('connect', () => {
			socketId.current = s.id as string
			s.emit('join-room', slug)
		})

		s.on('code-change', ({ from, to, insert, sender }) => {
			if (sender === socketId.current) return
			isRemoteChange.current = true
			viewRef.current?.dispatch({ changes: { from, to, insert } })
		})

		s.on('meta-change', ({ title, syntax }) => {
			setTitle(title)
			setSelectedSyntax(syntax)
		})

		return () => {
			s.emit('content-sync', {
				slug,
				content: viewRef.current?.state.doc.toString()
			})
			s.disconnect()
		}
	}, [slug])

	// Init editor
	// biome-ignore lint: No more deps
	useEffect(() => {
		if (!editorRef.current || viewRef.current) return
		const state = EditorState.create({
			doc: realtimePaste.content || '',
			extensions: createEditorExtensions()
		})
		viewRef.current = new EditorView({ state, parent: editorRef.current })
	}, [])

	// Reconfigure on syntax/theme change
	// biome-ignore lint: No more deps
	useEffect(() => {
		if (!viewRef.current) return
		viewRef.current.dispatch({
			effects: StateEffect.reconfigure.of(createEditorExtensions())
		})
	}, [selectedSyntax, cmTheme])

	// Auto-save every 5s
	useEffect(() => {
		const interval = setInterval(() => {
			const content = viewRef.current?.state.doc.toString() || ''
			socket.current?.emit('content-sync', { slug, content })
			socket.current?.emit('meta-sync', {
				slug,
				title,
				syntax: selectedSyntax
			})
		}, 5000)
		return () => clearInterval(interval)
	}, [slug, title, selectedSyntax])

	const isMarkdown = selectedSyntax.name === 'Markdown'

	// Cleanup scroll sync listeners on unmount
	useEffect(() => {
		return () => {
			if (detachSyncRef.current) {
				detachSyncRef.current()
			}
		}
	}, [])

	// Reset markdown view when leaving Markdown syntax
	useEffect(() => {
		if (!isMarkdown) {
			if (detachSyncRef.current) {
				detachSyncRef.current()
				detachSyncRef.current = null
			}
			setMarkdownSyncEnabled(false)
			setMarkdownMode('code')
		}
	}, [isMarkdown])

	// Disable sync if mode is no longer split
	useEffect(() => {
		if (markdownMode !== 'split' && detachSyncRef.current) {
			detachSyncRef.current()
			detachSyncRef.current = null
			setMarkdownSyncEnabled(false)
		}
	}, [markdownMode])

	const toggleMarkdownSyncScroll = () => {
		if (markdownSyncEnabled) {
			if (detachSyncRef.current) {
				detachSyncRef.current()
				detachSyncRef.current = null
			}
			setMarkdownSyncEnabled(false)
			return
		}

		if (!previewRef.current || !viewRef.current) return

		// Prefer the actual CodeMirror scroll DOM if available
		const codeEl =
			(viewRef.current as unknown as { scrollDOM?: HTMLElement })
				.scrollDOM ?? codeScrollRef.current

		if (!codeEl) return

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

		setMarkdownSyncEnabled(true)
	}

	const showCode =
		!isMarkdown || markdownMode === 'code' || markdownMode === 'split'
	const showPreview =
		isMarkdown && (markdownMode === 'split' || markdownMode === 'preview')

	return (
		<div className='flex flex-col gap-10'>
			<RealtimeCursors
				slug={slug}
				name={session?.user.name}
				socket={socket.current}
			/>
			<div className='relative'>
				<div className='absolute top-0 right-0 text-sm text-base-content/70'>
					{session ? (
						<span className='badge badge-success'>
							Logged in as {session.user.name}
						</span>
					) : (
						<span className='badge badge-warning'>
							Not logged in
						</span>
					)}
				</div>
			</div>
			<div className='flex lg:flex-row flex-col items-center font-bold text-center gap-4 justify-center'>
				<div className='flex flex-row items-center text-2xl font-bold text-center gap-4 justify-center'>
					<FaBolt className='w-7 h-7' />
					Realtime Editor "{slug}"
				</div>
				<div className='divider lg:divider-horizontal' />
				<RealtimePasteButtons
					realtimePaste={realtimePaste}
					content={content}
				/>
			</div>
			<div className='w-full flex flex-col md:flex-row gap-4'>
				<label className='form-control w-full'>
					<div className='label'>
						<span className='label-text'>Title</span>
					</div>
					<input
						type='text'
						className='input input-bordered w-full'
						placeholder='Paste Title'
						name='title'
						value={title}
						onChange={(e) => {
							const newTitle = e.target.value
							setTitle(newTitle)
							socket.current?.emit('meta-sync', {
								slug,
								title: newTitle,
								syntaxName: selectedSyntax.name
							})
						}}
					/>
				</label>

				<label className='form-control w-full'>
					<div className='label'>
						<span className='label-text'>Syntax</span>
					</div>
					<select
						className='select select-bordered w-full'
						style={{
							color: getContrastTextColor(selectedSyntax.color),
							backgroundColor: selectedSyntax.color
						}}
						value={selectedSyntax.name}
						onChange={(e) => {
							const selectedName = e.target.value

							setSelectedSyntax({
								...selectedSyntax,
								// @ts-expect-error
								name: selectedName
							})

							socket.current?.emit('meta-sync', {
								slug,
								title,
								syntaxName: selectedName
							})
						}}
					>
						{Object.keys(extensions).map((lang) => (
							<option key={lang} value={lang}>
								{lang}
							</option>
						))}
					</select>
				</label>
			</div>
			{isMarkdown && (
				<div className='flex items-center justify-between gap-2'>
					<div className='join'>
						<button
							type='button'
							className={`btn btn-xs sm:btn-sm join-item ${markdownMode === 'code' ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setMarkdownMode('code')}
						>
							Code
						</button>
						<button
							type='button'
							className={`btn btn-xs sm:btn-sm join-item ${markdownMode === 'split' ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setMarkdownMode('split')}
						>
							Split
						</button>
						<button
							type='button'
							className={`btn btn-xs sm:btn-sm join-item ${markdownMode === 'preview' ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => setMarkdownMode('preview')}
						>
							Preview
						</button>
					</div>

					{markdownMode === 'split' && (
						<button
							type='button'
							className={`btn btn-xs sm:btn-sm btn-outline ${markdownSyncEnabled ? 'btn-success' : 'btn-ghost'}`}
							onClick={toggleMarkdownSyncScroll}
							title='Toggle scroll sync between code and preview'
						>
										{markdownSyncEnabled ? (
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
							? 'max-h-[400px] md:max-h-[600px] lg:max-h-[800px]'
							: 'h-0 max-h-0 border-none p-0'
					}`}
				>
					<div ref={editorRef} className='min-h-[300px]' />
				</div>
				{showPreview && (
					<div
						ref={previewRef}
						className={`rounded-lg border border-dashed border-base-300 bg-base-100/90 dark:bg-base-200/90 overflow-auto max-h-[400px] md:max-h-[600px] lg:max-h-[800px] p-4 ${showCode ? 'w-full lg:w-1/2' : 'w-full'}`}
					>
						<div
							className='prose prose-sm max-w-none dark:prose-invert'
							// eslint-disable-next-line react/no-danger
							dangerouslySetInnerHTML={{
								__html: createSafeMarkdownHtml(content)
							}}
						/>
					</div>
				)}
			</div>
		</div>
	)
}
