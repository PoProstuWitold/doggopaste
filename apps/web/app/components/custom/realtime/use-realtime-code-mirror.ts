'use client'

import { indentWithTab } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import { Compartment, EditorState, type Extension } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { basicSetup, EditorView } from 'codemirror'
import { useCallback, useEffect, useRef } from 'react'
import { loadEditorLanguage } from '@/app/utils/editor-language'
import type { CodeChangeBatch, CursorSelection } from './socket-contract'

const editorHeight = EditorView.theme({
	'&': {
		height: '800px',
		overflow: 'auto'
	}
})

type UseRealtimeCodeMirrorOptions = {
	initialContent: string
	languageName: string
	theme: Extension
	isJoined: boolean
	onDocumentChange: (content: string) => void
	onLocalChange: (change: CodeChangeBatch) => void
}

export const useRealtimeCodeMirror = ({
	initialContent,
	languageName,
	theme,
	isJoined,
	onDocumentChange,
	onLocalChange
}: UseRealtimeCodeMirrorOptions) => {
	const editorContainerRef = useRef<HTMLDivElement>(null)
	const editorViewRef = useRef<EditorView | null>(null)
	const languageCompartmentRef = useRef(new Compartment())
	const themeCompartmentRef = useRef(new Compartment())
	const readOnlyCompartmentRef = useRef(new Compartment())
	const applyingRemoteChangeRef = useRef(false)
	const languageRequestRef = useRef(0)
	const initialContentRef = useRef(initialContent)
	const initialThemeRef = useRef(theme)
	const onDocumentChangeRef = useRef(onDocumentChange)
	const onLocalChangeRef = useRef(onLocalChange)

	onDocumentChangeRef.current = onDocumentChange
	onLocalChangeRef.current = onLocalChange

	useEffect(() => {
		const parent = editorContainerRef.current
		if (!parent || editorViewRef.current) return

		const state = EditorState.create({
			doc: initialContentRef.current,
			extensions: [
				basicSetup,
				indentUnit.of('    '),
				keymap.of([indentWithTab]),
				languageCompartmentRef.current.of([]),
				themeCompartmentRef.current.of(initialThemeRef.current),
				readOnlyCompartmentRef.current.of(
					EditorState.readOnly.of(true)
				),
				editorHeight,
				EditorView.updateListener.of((update) => {
					if (!update.docChanged) return

					onDocumentChangeRef.current(update.state.doc.toString())
					if (applyingRemoteChangeRef.current) return

					const changes: CodeChangeBatch['changes'] = []
					update.changes.iterChanges(
						(from, to, _fromAfter, _toAfter, inserted) => {
							changes.push({
								from,
								to,
								insert: inserted.toString()
							})
						}
					)
					if (changes.length > 0)
						onLocalChangeRef.current({ changes })
				})
			]
		})
		const view = new EditorView({ state, parent })
		editorViewRef.current = view

		return () => {
			languageRequestRef.current += 1
			view.destroy()
			if (editorViewRef.current === view) editorViewRef.current = null
		}
	}, [])

	useEffect(() => {
		const view = editorViewRef.current
		if (!view) return

		view.dispatch({
			effects: themeCompartmentRef.current.reconfigure(theme)
		})
	}, [theme])

	useEffect(() => {
		const view = editorViewRef.current
		if (!view) return

		view.dispatch({
			effects: readOnlyCompartmentRef.current.reconfigure(
				EditorState.readOnly.of(!isJoined)
			)
		})
	}, [isJoined])

	useEffect(() => {
		const request = ++languageRequestRef.current

		void loadEditorLanguage(languageName).then((language) => {
			const view = editorViewRef.current
			if (!view || request !== languageRequestRef.current) return

			view.dispatch({
				effects: languageCompartmentRef.current.reconfigure(language)
			})
		})
	}, [languageName])

	const replaceDocument = useCallback((content: string) => {
		const view = editorViewRef.current
		if (!view || view.state.doc.toString() === content) return

		applyingRemoteChangeRef.current = true
		try {
			view.dispatch({
				changes: { from: 0, to: view.state.doc.length, insert: content }
			})
		} finally {
			applyingRemoteChangeRef.current = false
		}
	}, [])

	const applyRemoteChanges = useCallback((batch: CodeChangeBatch) => {
		const view = editorViewRef.current
		if (!view || batch.changes.length === 0) return false

		let previousTo = 0
		for (const change of batch.changes) {
			if (
				change.from < previousTo ||
				change.to < change.from ||
				change.to > view.state.doc.length
			) {
				return false
			}
			previousTo = change.to
		}

		applyingRemoteChangeRef.current = true
		try {
			view.dispatch({ changes: batch.changes })
			return true
		} finally {
			applyingRemoteChangeRef.current = false
		}
	}, [])

	const getDocument = useCallback(
		() => editorViewRef.current?.state.doc.toString() ?? initialContent,
		[initialContent]
	)

	const getSelection = useCallback((): CursorSelection => {
		const selection = editorViewRef.current?.state.selection.main
		return selection
			? { anchor: selection.anchor, head: selection.head }
			: { anchor: 0, head: 0 }
	}, [])

	return {
		editorContainerRef,
		applyRemoteChanges,
		replaceDocument,
		getDocument,
		getSelection
	}
}
