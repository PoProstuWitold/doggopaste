'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaBolt } from 'react-icons/fa'
import { useTheme } from '../../context/ThemeContext'
import type { RealtimePaste, RealtimeViewerDto, Syntax } from '../../types'
import { RealtimeCursors } from './RealtimeCursors'
import { RealtimePasteButtons } from './RealtimePasteButtons'
import { RealtimeMarkdownWorkspace } from './realtime/RealtimeMarkdownWorkspace'
import { RealtimeMetadataFields } from './realtime/RealtimeMetadataFields'
import type {
	CodeChangeBatch,
	RealtimeSnapshot,
	SaveResult
} from './realtime/socket-contract'
import { useRealtimeCodeMirror } from './realtime/use-realtime-code-mirror'
import {
	type ActiveRemotePresence,
	useRealtimePresence
} from './realtime/use-realtime-presence'
import { useRealtimeSocket } from './realtime/use-realtime-socket'

const FALLBACK_SYNTAX: Syntax = {
	name: 'Plaintext',
	extension: 'txt',
	color: '#808080'
}

export const RealtimeEditor = ({
	slug,
	realtimePaste,
	viewer
}: {
	slug: string
	realtimePaste: RealtimePaste
	viewer: RealtimeViewerDto | null
}) => {
	const { cmTheme } = useTheme()
	const [title, setTitle] = useState(realtimePaste.title || '')
	const [content, setContent] = useState(realtimePaste.content || '')
	const [selectedSyntax, setSelectedSyntax] = useState(
		realtimePaste.syntax ?? FALLBACK_SYNTAX
	)
	const anonymousNameRef = useRef(
		`Anon${Math.floor(1000 + Math.random() * 9000)}`
	)
	const participantName = viewer?.name || anonymousNameRef.current
	const contentDirtyRef = useRef(false)
	const metadataDirtyRef = useRef(false)
	const titleDirtyRef = useRef(false)
	const syntaxDirtyRef = useRef(false)
	const titleRef = useRef(realtimePaste.title || '')
	const syntaxRef = useRef(realtimePaste.syntax ?? FALLBACK_SYNTAX)
	const confirmedTitleRef = useRef(realtimePaste.title || '')
	const confirmedSyntaxRef = useRef(realtimePaste.syntax ?? FALLBACK_SYNTAX)
	const flushInProgressRef = useRef(false)
	const flushAgainRef = useRef(false)
	const metadataTimerRef = useRef<number | null>(null)
	const replaceDocumentRef = useRef<(content: string) => void>(
		() => undefined
	)
	const applyRemoteCodeChangeRef = useRef<
		(change: CodeChangeBatch) => boolean
	>(() => false)

	const handleSnapshot = useCallback((snapshot: RealtimeSnapshot) => {
		contentDirtyRef.current = false
		metadataDirtyRef.current = false
		titleDirtyRef.current = false
		syntaxDirtyRef.current = false
		confirmedTitleRef.current = snapshot.title
		confirmedSyntaxRef.current = snapshot.syntax
		titleRef.current = snapshot.title
		syntaxRef.current = snapshot.syntax
		setContent(snapshot.content)
		setTitle(snapshot.title)
		setSelectedSyntax(snapshot.syntax)
		replaceDocumentRef.current(snapshot.content)
	}, [])

	const {
		activeSocket,
		isJoined,
		sendCodeChange,
		saveContent,
		saveMetadata,
		getRevision
	} = useRealtimeSocket({
		slug,
		initialRevision: realtimePaste.revision,
		onSnapshot: handleSnapshot,
		onRemoteContent: (remoteContent) => {
			contentDirtyRef.current = false
			metadataDirtyRef.current = false
			titleDirtyRef.current = false
			syntaxDirtyRef.current = false
			setContent(remoteContent)
			titleRef.current = confirmedTitleRef.current
			syntaxRef.current = confirmedSyntaxRef.current
			setTitle(confirmedTitleRef.current)
			setSelectedSyntax(confirmedSyntaxRef.current)
			replaceDocumentRef.current(remoteContent)
		},
		onRemoteMetadata: (remoteTitle, remoteSyntax) => {
			confirmedTitleRef.current = remoteTitle
			confirmedSyntaxRef.current = remoteSyntax
			if (!titleDirtyRef.current) {
				titleRef.current = remoteTitle
				setTitle(remoteTitle)
			}
			if (!syntaxDirtyRef.current) {
				syntaxRef.current = remoteSyntax
				setSelectedSyntax(remoteSyntax)
			}
			metadataDirtyRef.current =
				titleDirtyRef.current || syntaxDirtyRef.current
		},
		onRemoteCodeChange: (change) => applyRemoteCodeChangeRef.current(change)
	})

	const { remotePresence, publishPresence, publishTitleChange } =
		useRealtimePresence({
			socket: activeSocket,
			enabled: isJoined,
			name: participantName,
			getRevision,
			onRemoteTitleChange: (remoteTitle) => {
				if (titleDirtyRef.current) return
				titleRef.current = remoteTitle
				setTitle(remoteTitle)
			}
		})
	const remoteContentPresence = useMemo(
		() =>
			Object.values(remotePresence).filter(
				(
					presence
				): presence is ActiveRemotePresence & { field: 'content' } =>
					presence.field === 'content'
			),
		[remotePresence]
	)
	const remoteTitlePresence = useMemo(
		() =>
			Object.values(remotePresence).filter(
				(
					presence
				): presence is ActiveRemotePresence & { field: 'title' } =>
					presence.field === 'title'
			),
		[remotePresence]
	)
	const remoteSyntaxPresence = useMemo(
		() =>
			Object.values(remotePresence).filter(
				(
					presence
				): presence is ActiveRemotePresence & { field: 'syntax' } =>
					presence.field === 'syntax'
			),
		[remotePresence]
	)

	const {
		editorContainerRef,
		applyRemoteChanges,
		replaceDocument,
		getDocument,
		getSelection
	} = useRealtimeCodeMirror({
		initialContent: realtimePaste.content || '',
		languageName: selectedSyntax.name,
		theme: cmTheme,
		isJoined,
		remoteSelections: remoteContentPresence,
		onDocumentChange: setContent,
		onLocalChange: (change) => {
			contentDirtyRef.current = true
			sendCodeChange(change)
		},
		onSelectionChange: (selection) =>
			publishPresence(
				selection ? { field: 'content', selection } : { field: 'idle' }
			)
	})

	replaceDocumentRef.current = replaceDocument
	applyRemoteCodeChangeRef.current = applyRemoteChanges

	const flushChanges = useCallback(async () => {
		if (flushInProgressRef.current) {
			flushAgainRef.current = true
			return
		}
		flushInProgressRef.current = true

		try {
			if (contentDirtyRef.current) {
				const snapshot = getDocument()
				contentDirtyRef.current = false
				const result = await saveContent(snapshot)
				if (result === 'retryable_error') {
					contentDirtyRef.current = true
					return
				}
				if (result === 'resynced' || result === 'discarded') return
			}

			if (metadataDirtyRef.current) {
				const metadata = {
					title: titleRef.current,
					syntaxName: syntaxRef.current.name
				}
				const titleWasDirty = titleDirtyRef.current
				const syntaxWasDirty = syntaxDirtyRef.current
				metadataDirtyRef.current = false
				titleDirtyRef.current = false
				syntaxDirtyRef.current = false
				const result: SaveResult = await saveMetadata(
					metadata.title,
					metadata.syntaxName
				)
				if (result === 'retryable_error') {
					titleDirtyRef.current ||= titleWasDirty
					syntaxDirtyRef.current ||= syntaxWasDirty
					metadataDirtyRef.current = true
				}
			}
		} finally {
			flushInProgressRef.current = false
			if (flushAgainRef.current) {
				flushAgainRef.current = false
				queueMicrotask(() => void flushChangesRef.current())
			}
		}
	}, [getDocument, saveContent, saveMetadata])

	const flushChangesRef = useRef(flushChanges)
	flushChangesRef.current = flushChanges

	useEffect(() => {
		const interval = window.setInterval(() => {
			void flushChangesRef.current()
		}, 5000)
		return () => window.clearInterval(interval)
	}, [])

	useEffect(
		() => () => {
			if (metadataTimerRef.current !== null) {
				window.clearTimeout(metadataTimerRef.current)
			}
		},
		[]
	)

	const scheduleMetadataSave = () => {
		if (metadataTimerRef.current !== null) {
			window.clearTimeout(metadataTimerRef.current)
		}
		metadataTimerRef.current = window.setTimeout(() => {
			metadataTimerRef.current = null
			void flushChangesRef.current()
		}, 350)
	}

	const handleTitleChange = (nextTitle: string) => {
		titleRef.current = nextTitle
		setTitle(nextTitle)
		titleDirtyRef.current = true
		metadataDirtyRef.current = true
		publishTitleChange(nextTitle)
		scheduleMetadataSave()
	}

	const handleSyntaxChange = (syntaxName: string) => {
		const nextSyntax = { ...syntaxRef.current, name: syntaxName }
		syntaxRef.current = nextSyntax
		setSelectedSyntax(nextSyntax)
		syntaxDirtyRef.current = true
		metadataDirtyRef.current = true
		scheduleMetadataSave()
	}

	return (
		<div className='flex flex-col gap-10'>
			<RealtimeCursors
				name={participantName}
				socket={activeSocket}
				enabled={isJoined}
				getSelection={getSelection}
				getRevision={getRevision}
			/>
			<div className='relative'>
				<div className='absolute top-0 right-0 text-sm text-base-content/70'>
					{viewer ? (
						<span className='badge badge-success'>
							Logged in as {viewer.name}
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
			<RealtimeMetadataFields
				title={title}
				syntax={selectedSyntax}
				disabled={!isJoined}
				remoteTitlePresence={remoteTitlePresence}
				remoteSyntaxPresence={remoteSyntaxPresence}
				onTitleChange={handleTitleChange}
				onSyntaxChange={handleSyntaxChange}
				onTitlePresence={(selection) =>
					publishPresence(
						selection
							? { field: 'title', selection }
							: { field: 'idle' }
					)
				}
				onSyntaxPresence={(active) =>
					publishPresence(
						active ? { field: 'syntax' } : { field: 'idle' }
					)
				}
			/>
			<RealtimeMarkdownWorkspace
				content={content}
				isMarkdown={selectedSyntax.name === 'Markdown'}
				editorContainerRef={editorContainerRef}
			/>
		</div>
	)
}
