'use client'

import { indentWithTab } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { EditorView, basicSetup } from 'codemirror'

import { useEffect, useRef } from 'react'
import io from 'socket.io-client'
import type { RealtimePaste } from '../types'
import { extensions } from '../utils/functions'

const socket = io(process.env.NEXT_PUBLIC_HONO_API_URL, {
	path: '/ws',
	withCredentials: true
})

export const RealtimeEditor = ({
	slug,
	realtimePaste
}: {
	slug: string
	realtimePaste?: RealtimePaste
}) => {
	const syntax = realtimePaste?.syntax || 'JavaScript'
	const editorRef = useRef<HTMLDivElement>(null)
	const viewRef = useRef<EditorView | null>(null)
	const socketIdRef = useRef<string | null>(null)
	const isRemoteChange = useRef(false)

	useEffect(() => {
		if (!editorRef.current) return

		socket.on('connect', () => {
			//@ts-ignore
			socketIdRef.current = socket.id
			socket.emit('join-room', slug) // dołączenie do pokoju na podstawie slug
		})

		const state = EditorState.create({
			doc: '',
			extensions: [
				basicSetup,
				indentUnit.of('    '),
				keymap.of([indentWithTab]),
				extensions[syntax as keyof typeof extensions],
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
			socket.off('code-change')
			view.destroy()
		}
	}, [slug, syntax])

	return <div ref={editorRef} className='border rounded-md min-h-[400px]' />
}
