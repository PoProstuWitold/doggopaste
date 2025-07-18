'use client'

import { indentWithTab } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { EditorState, StateEffect } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { basicSetup, EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import { FaFileCode } from 'react-icons/fa'
import io, { type Socket } from 'socket.io-client'
import { useTheme } from '../context/ThemeContext'
import type { RealtimePaste, Session, User } from '../types'
import {
	extensions,
	getBaseApiUrl,
	getContrastTextColor
} from '../utils/functions'
import { RealtimeCursors } from './RealtimeCursors'
import { RealtimePasteButtons } from './RealtimePasteButtons'

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
				<div className='flex flex-row items-center text-3xl font-bold text-center gap-4 justify-center'>
					<FaFileCode className='w-10 h-10' />
					Paste "{slug}"
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
						<span className='label-text'>Name / Title</span>
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
						<span className='label-text'>Syntax Highlighting</span>
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
								// @ts-ignore
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
			<div
				ref={editorRef}
				className='max-h-[400px] md:max-h-[600px] lg:max-h-[800px] overflow-auto'
			/>
		</div>
	)
}
