'use client'

import { indentWithTab } from '@codemirror/commands'
import { indentUnit } from '@codemirror/language'
import {
	type ChangeSet,
	Compartment,
	EditorState,
	type Extension,
	StateEffect,
	StateField
} from '@codemirror/state'
import {
	Decoration,
	type DecorationSet,
	keymap,
	WidgetType
} from '@codemirror/view'
import { basicSetup, EditorView } from 'codemirror'
import { useCallback, useEffect, useRef } from 'react'
import { loadEditorLanguage } from '@/app/utils/editor-language'
import { getPresenceColor } from './presence-color'
import type {
	CodeChangeBatch,
	CursorSelection,
	RemoteTextPresence
} from './socket-contract'

const DOCUMENT_STATE_INTERVAL_MS = 50

const editorHeight = EditorView.theme({
	'&': {
		height: '800px',
		overflow: 'auto'
	}
})

class RemoteCaretWidget extends WidgetType {
	constructor(
		readonly id: string,
		readonly name: string,
		readonly color: string
	) {
		super()
	}

	eq(other: RemoteCaretWidget) {
		return (
			other.id === this.id &&
			other.name === this.name &&
			other.color === this.color
		)
	}

	toDOM() {
		const caret = document.createElement('span')
		caret.setAttribute('aria-hidden', 'true')
		caret.title = this.name
		caret.style.cssText = [
			'position: relative',
			'display: inline-block',
			'width: 0',
			'height: 1.2em',
			'vertical-align: text-bottom',
			`border-left: 2px solid ${this.color}`,
			'pointer-events: none',
			'z-index: 5'
		].join(';')

		const label = document.createElement('span')
		label.textContent = this.name
		label.style.cssText = [
			'position: absolute',
			'left: -2px',
			'bottom: 100%',
			'padding: 1px 4px',
			'border-radius: 3px 3px 3px 0',
			'font: 10px/1.3 monospace',
			'white-space: nowrap',
			'color: white',
			`background: ${this.color}`
		].join(';')
		caret.append(label)
		return caret
	}
}

const setRemoteSelectionsEffect =
	StateEffect.define<readonly RemoteTextPresence[]>()

const createRemoteSelectionDecorations = (
	documentLength: number,
	presences: readonly RemoteTextPresence[]
): DecorationSet => {
	const ranges = presences.map((presence) => {
		const anchor = Math.min(presence.selection.anchor, documentLength)
		const head = Math.min(presence.selection.head, documentLength)
		const from = Math.min(anchor, head)
		const to = Math.max(anchor, head)
		const color = getPresenceColor(presence.id)
		const name = presence.name || 'Guest'

		if (from === to) {
			return Decoration.widget({
				widget: new RemoteCaretWidget(presence.id, name, color),
				side: 1
			}).range(from)
		}

		return Decoration.mark({
			attributes: {
				style: `background-color: ${color}33; box-shadow: inset 0 -2px ${color};`,
				title: name,
				'data-realtime-presence': presence.id
			}
		}).range(from, to)
	})

	return Decoration.set(ranges, true)
}

const remoteSelectionField = StateField.define<DecorationSet>({
	create: () => Decoration.none,
	update: (decorations, transaction) => {
		let next = decorations.map(transaction.changes)
		for (const effect of transaction.effects) {
			if (effect.is(setRemoteSelectionsEffect)) {
				next = createRemoteSelectionDecorations(
					transaction.state.doc.length,
					effect.value
				)
			}
		}
		return next
	},
	provide: (field) => EditorView.decorations.from(field)
})

type UseRealtimeCodeMirrorOptions = {
	initialContent: string
	languageName: string
	theme: Extension
	isJoined: boolean
	remoteSelections: readonly RemoteTextPresence[]
	onDocumentChange: (content: string) => void
	onLocalChange: (change: CodeChangeBatch) => void
	onSelectionChange: (selection: CursorSelection | null) => void
}

export const useRealtimeCodeMirror = ({
	initialContent,
	languageName,
	theme,
	isJoined,
	remoteSelections,
	onDocumentChange,
	onLocalChange,
	onSelectionChange
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
	const onSelectionChangeRef = useRef(onSelectionChange)
	const documentStateTimerRef = useRef<number | null>(null)
	const renderedRemoteSelectionsRef = useRef<readonly RemoteTextPresence[]>(
		[]
	)
	const pendingLocalChangesRef = useRef<ChangeSet | null>(null)
	const localChangesFrameRef = useRef<number | null>(null)

	onDocumentChangeRef.current = onDocumentChange
	onLocalChangeRef.current = onLocalChange
	onSelectionChangeRef.current = onSelectionChange

	const flushPendingLocalChanges = useCallback(() => {
		if (localChangesFrameRef.current !== null) {
			window.cancelAnimationFrame(localChangesFrameRef.current)
			localChangesFrameRef.current = null
		}
		const pending = pendingLocalChangesRef.current
		pendingLocalChangesRef.current = null
		if (!pending) return

		const changes: CodeChangeBatch['changes'] = []
		pending.iterChanges((from, to, _fromAfter, _toAfter, inserted) => {
			changes.push({ from, to, insert: inserted.toString() })
		})
		if (changes.length > 0) onLocalChangeRef.current({ changes })
	}, [])
	const discardPendingLocalChanges = useCallback(() => {
		if (localChangesFrameRef.current !== null) {
			window.cancelAnimationFrame(localChangesFrameRef.current)
			localChangesFrameRef.current = null
		}
		pendingLocalChangesRef.current = null
	}, [])

	const scheduleLocalChanges = useCallback(
		(changes: ChangeSet) => {
			pendingLocalChangesRef.current = pendingLocalChangesRef.current
				? pendingLocalChangesRef.current.compose(changes)
				: changes
			if (localChangesFrameRef.current !== null) return

			localChangesFrameRef.current = window.requestAnimationFrame(() => {
				localChangesFrameRef.current = null
				flushPendingLocalChanges()
			})
		},
		[flushPendingLocalChanges]
	)

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
				remoteSelectionField,
				editorHeight,
				EditorView.updateListener.of((update) => {
					if (update.docChanged) {
						if (documentStateTimerRef.current === null) {
							documentStateTimerRef.current = window.setTimeout(
								() => {
									documentStateTimerRef.current = null
									const currentView = editorViewRef.current
									if (currentView) {
										onDocumentChangeRef.current(
											currentView.state.doc.toString()
										)
									}
								},
								DOCUMENT_STATE_INTERVAL_MS
							)
						}

						if (!applyingRemoteChangeRef.current) {
							scheduleLocalChanges(update.changes)
						}
					}

					if (update.selectionSet && update.view.hasFocus) {
						const selection = update.state.selection.main
						onSelectionChangeRef.current({
							anchor: selection.anchor,
							head: selection.head
						})
					}
				}),
				EditorView.domEventHandlers({
					focus: (_event, view) => {
						const selection = view.state.selection.main
						onSelectionChangeRef.current({
							anchor: selection.anchor,
							head: selection.head
						})
					},
					blur: () => onSelectionChangeRef.current(null)
				})
			]
		})
		const view = new EditorView({ state, parent })
		editorViewRef.current = view

		return () => {
			languageRequestRef.current += 1
			flushPendingLocalChanges()
			if (documentStateTimerRef.current !== null) {
				window.clearTimeout(documentStateTimerRef.current)
				documentStateTimerRef.current = null
			}
			view.destroy()
			if (editorViewRef.current === view) editorViewRef.current = null
		}
	}, [flushPendingLocalChanges, scheduleLocalChanges])

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

	useEffect(() => {
		const view = editorViewRef.current
		if (!view) return
		const previous = renderedRemoteSelectionsRef.current
		if (
			previous.length === remoteSelections.length &&
			previous.every((selection, index) => {
				const next = remoteSelections[index]
				if (!next) return false
				return (
					next.id === selection.id &&
					next.name === selection.name &&
					next.selection.anchor === selection.selection.anchor &&
					next.selection.head === selection.selection.head
				)
			})
		) {
			return
		}
		renderedRemoteSelectionsRef.current = remoteSelections

		view.dispatch({
			effects: setRemoteSelectionsEffect.of(remoteSelections)
		})
	}, [remoteSelections])

	const replaceDocument = useCallback(
		(content: string) => {
			discardPendingLocalChanges()
			const view = editorViewRef.current
			if (!view || view.state.doc.toString() === content) return

			applyingRemoteChangeRef.current = true
			try {
				view.dispatch({
					changes: {
						from: 0,
						to: view.state.doc.length,
						insert: content
					}
				})
			} finally {
				applyingRemoteChangeRef.current = false
			}
		},
		[discardPendingLocalChanges]
	)

	const applyRemoteChanges = useCallback(
		(batch: CodeChangeBatch) => {
			flushPendingLocalChanges()
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
		},
		[flushPendingLocalChanges]
	)

	const getDocument = useCallback(() => {
		flushPendingLocalChanges()
		return editorViewRef.current?.state.doc.toString() ?? initialContent
	}, [flushPendingLocalChanges, initialContent])

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
