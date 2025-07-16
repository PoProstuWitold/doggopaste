'use client'

import { indentWithTab } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { EditorState, StateEffect } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { basicSetup, EditorView } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import { FaFileCode } from 'react-icons/fa'
import io from 'socket.io-client'
import { useTheme } from '../context/ThemeContext'
import type { RealtimePaste, Session, User } from '../types'
import {
	extensions,
	getBaseApiUrl,
	getContrastTextColor
} from '../utils/functions'
import { RealtimePasteButtons } from './RealtimePasteButtons'

const socket = io(getBaseApiUrl(), {
	path: '/ws',
	withCredentials: true
})

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

	const syntax = realtimePaste?.syntax?.name || 'Plaintext'
	const [selectedSyntax, setSelectedSyntax] = useState(
		realtimePaste.syntax ?? { name: 'Plaintext' }
	)
	const [title, setTitle] = useState(realtimePaste.title || '')
	const editorRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<EditorView | null>(null)
	const socketIdRef = useRef<string | null>(null)
	const isRemoteChange = useRef(false)

	useEffect(() => {
		if (!editorRef.current) return

		socket.on('connect', () => {
			//@ts-ignore
			socketIdRef.current = socket.id
			socket.emit('join-room', slug)
		})

		const state = EditorState.create({
			doc: realtimePaste?.content || '',
			extensions: [
				basicSetup,
				indentUnit.of('    '),
				keymap.of([indentWithTab]),
				extensions[syntax as keyof typeof extensions],
				cmTheme,
				EditorView.updateListener.of((update) => {
					if (isRemoteChange.current) {
						isRemoteChange.current = false
						return
					}

					if (update.docChanged && socketIdRef.current) {
						update.changes.iterChanges(
							(fromA, toA, _fromB, _toB, inserted) => {
								socket.emit('code-change', {
									from: fromA,
									to: toA,
									insert: inserted.toString(),
									sender: socketIdRef.current,
									slug
								})
							}
						)
					}
				})
			]
		})

		const view = new EditorView({
			state,
			parent: editorRef.current
		})

		viewRef.current = view

		socket.on('code-change', ({ from, to, insert, sender }) => {
			if (sender === socketIdRef.current) return

			isRemoteChange.current = true

			viewRef.current?.dispatch({
				changes: { from, to, insert }
			})
		})

		return () => {
			// Send the last content on disconnect
			socket.emit('content-sync', {
				slug,
				content: view.state.doc.toString()
			})
			socket.off('code-change')
			view.destroy()
		}
	}, [slug, syntax, realtimePaste?.content, cmTheme])

	// Every 5 seconds, send the current content to the server
	useEffect(() => {
		const interval = setInterval(() => {
			if (!viewRef.current) return

			const content = viewRef.current.state.doc.toString()
			socket.emit('content-sync', {
				slug,
				content
			})

			socket.emit('meta-sync', {
				slug,
				title,
				syntax: selectedSyntax
			})
		}, 5000)

		return () => clearInterval(interval)
	}, [slug, title, selectedSyntax])

	useEffect(() => {
		socket.on('meta-change', ({ title, syntax }) => {
			setTitle(title)
			setSelectedSyntax(syntax)
		})

		return () => {
			socket.off('meta-change')
		}
	}, [])

	// biome-ignore lint: Can't add another dependency
	useEffect(() => {
		if (!viewRef.current) return

		const newExtensions = [
			basicSetup,
			indentUnit.of('    '),
			keymap.of([indentWithTab]),
			extensions[selectedSyntax.name as keyof typeof extensions],
			cmTheme,
			EditorView.updateListener.of((update) => {
				if (isRemoteChange.current) {
					isRemoteChange.current = false
					return
				}

				if (update.docChanged && socketIdRef.current) {
					update.changes.iterChanges(
						(fromA, toA, _fromB, _toB, inserted) => {
							socket.emit('code-change', {
								from: fromA,
								to: toA,
								insert: inserted.toString(),
								sender: socketIdRef.current,
								slug
							})
						}
					)
				}
			})
		]

		viewRef.current.dispatch({
			effects: StateEffect.reconfigure.of(newExtensions)
		})
	}, [selectedSyntax, cmTheme])

	return (
		<div className='flex flex-col gap-10'>
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
				<RealtimePasteButtons realtimePaste={realtimePaste} />
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
							socket.emit('meta-sync', {
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

							socket.emit('meta-sync', {
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
			<div ref={editorRef} className='border rounded-md min-h-[400px]' />
		</div>
	)
}
