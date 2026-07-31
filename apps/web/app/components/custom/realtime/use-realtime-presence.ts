'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type {
	RealtimePresenceUpdate,
	RemoteLiveTitleChange,
	RemotePresenceLeave,
	RemotePresenceUpdate
} from './socket-contract'

const PRESENCE_EMIT_INTERVAL_MS = 33
const PRESENCE_HEARTBEAT_MS = 4_000
const PRESENCE_TTL_MS = 15_000
const PRESENCE_CLEANUP_INTERVAL_MS = 5_000

export type ActiveRemotePresence = RemotePresenceUpdate & {
	lastSeen: number
}

type PresenceWithoutName =
	| Omit<
			Extract<RealtimePresenceUpdate, { field: 'content' | 'title' }>,
			'name'
	  >
	| { field: 'syntax' }
	| { field: 'idle' }

export const useRealtimePresence = ({
	socket,
	enabled,
	name,
	getRevision,
	onRemoteTitleChange
}: {
	socket: Socket | null
	enabled: boolean
	name: string
	getRevision: () => number
	onRemoteTitleChange: (title: string) => void
}) => {
	const [remotePresence, setRemotePresence] = useState<
		Record<string, ActiveRemotePresence>
	>({})
	const enabledRef = useRef(enabled)
	const nameRef = useRef(name)
	const currentPresenceRef = useRef<RealtimePresenceUpdate>({
		field: 'idle',
		name
	})
	const pendingPresenceRef = useRef<RealtimePresenceUpdate | null>(null)
	const lastEmitAtRef = useRef(0)
	const emitTimerRef = useRef<number | null>(null)
	const pendingTitleRef = useRef<string | null>(null)
	const lastTitleEmitAtRef = useRef(0)
	const titleEmitTimerRef = useRef<number | null>(null)
	const onRemoteTitleChangeRef = useRef(onRemoteTitleChange)

	enabledRef.current = enabled
	nameRef.current = name
	onRemoteTitleChangeRef.current = onRemoteTitleChange
	currentPresenceRef.current = {
		...currentPresenceRef.current,
		name
	}

	const cancelPendingEmit = useCallback(() => {
		if (emitTimerRef.current !== null) {
			window.clearTimeout(emitTimerRef.current)
			emitTimerRef.current = null
		}
		pendingPresenceRef.current = null
	}, [])
	const cancelPendingTitle = useCallback(() => {
		if (titleEmitTimerRef.current !== null) {
			window.clearTimeout(titleEmitTimerRef.current)
			titleEmitTimerRef.current = null
		}
		pendingTitleRef.current = null
	}, [])

	const flushPendingPresence = useCallback(() => {
		emitTimerRef.current = null
		const pending = pendingPresenceRef.current
		pendingPresenceRef.current = null
		if (!pending || !enabledRef.current || !socket?.connected) return

		lastEmitAtRef.current = Date.now()
		socket.volatile.emit('presence-update', pending)
	}, [socket])

	const schedulePresence = useCallback(
		(presence: RealtimePresenceUpdate) => {
			pendingPresenceRef.current = presence
			if (emitTimerRef.current !== null) return

			const elapsed = Date.now() - lastEmitAtRef.current
			const delay = Math.max(0, PRESENCE_EMIT_INTERVAL_MS - elapsed)
			emitTimerRef.current = window.setTimeout(
				flushPendingPresence,
				delay
			)
		},
		[flushPendingPresence]
	)

	const flushPendingTitle = useCallback(() => {
		titleEmitTimerRef.current = null
		const title = pendingTitleRef.current
		pendingTitleRef.current = null
		if (title === null || !enabledRef.current || !socket?.connected) return

		lastTitleEmitAtRef.current = Date.now()
		socket.volatile.emit('title-change', { title })
	}, [socket])

	const publishTitleChange = useCallback(
		(title: string) => {
			pendingTitleRef.current = title
			if (titleEmitTimerRef.current !== null) return

			const elapsed = Date.now() - lastTitleEmitAtRef.current
			const delay = Math.max(0, PRESENCE_EMIT_INTERVAL_MS - elapsed)
			titleEmitTimerRef.current = window.setTimeout(
				flushPendingTitle,
				delay
			)
		},
		[flushPendingTitle]
	)

	const publishPresence = useCallback(
		(presence: PresenceWithoutName) => {
			const namedPresence = {
				...presence,
				name: nameRef.current
			} as RealtimePresenceUpdate
			currentPresenceRef.current = namedPresence

			if (presence.field === 'content' || presence.field === 'title') {
				schedulePresence(namedPresence)
				return
			}

			cancelPendingEmit()
			if (enabledRef.current && socket?.connected) {
				socket.emit('presence-update', namedPresence)
			}
		},
		[cancelPendingEmit, schedulePresence, socket]
	)

	useEffect(() => {
		if (!enabled) {
			if (
				currentPresenceRef.current.field !== 'idle' &&
				socket?.connected
			) {
				socket.emit('presence-update', { field: 'idle', name })
			}
			cancelPendingEmit()
			cancelPendingTitle()
			currentPresenceRef.current = { field: 'idle', name }
			setRemotePresence({})
			return
		}

		const heartbeat = window.setInterval(() => {
			const current = currentPresenceRef.current
			if (current.field !== 'idle' && socket?.connected) {
				socket.emit('presence-update', current)
			}
		}, PRESENCE_HEARTBEAT_MS)

		return () => window.clearInterval(heartbeat)
	}, [cancelPendingEmit, cancelPendingTitle, enabled, name, socket])

	useEffect(() => {
		const clearPresence = () => setRemotePresence({})
		const handlePresence = (presence: RemotePresenceUpdate) => {
			if (
				!enabledRef.current ||
				presence.id === socket?.id ||
				presence.revision < getRevision()
			) {
				return
			}

			setRemotePresence((previous) => {
				if (presence.field === 'idle') {
					if (!previous[presence.id]) return previous
					const updated = { ...previous }
					delete updated[presence.id]
					return updated
				}

				return {
					...previous,
					[presence.id]: { ...presence, lastSeen: Date.now() }
				}
			})
		}
		const handleLeave = ({ id }: RemotePresenceLeave) => {
			setRemotePresence((previous) => {
				if (!previous[id]) return previous
				const updated = { ...previous }
				delete updated[id]
				return updated
			})
		}
		const handleTitleChange = (change: RemoteLiveTitleChange) => {
			if (
				!enabledRef.current ||
				change.sender === socket?.id ||
				change.revision < getRevision()
			) {
				return
			}
			onRemoteTitleChangeRef.current(change.title)
		}

		socket?.on('presence-update', handlePresence)
		socket?.on('presence-leave', handleLeave)
		socket?.on('title-change', handleTitleChange)
		socket?.on('connect', clearPresence)
		socket?.on('disconnect', clearPresence)

		const cleanup = window.setInterval(() => {
			const threshold = Date.now() - PRESENCE_TTL_MS
			setRemotePresence((previous) => {
				const active = Object.fromEntries(
					Object.entries(previous).filter(
						([, presence]) => presence.lastSeen >= threshold
					)
				)
				return Object.keys(active).length ===
					Object.keys(previous).length
					? previous
					: active
			})
		}, PRESENCE_CLEANUP_INTERVAL_MS)

		return () => {
			window.clearInterval(cleanup)
			socket?.off('presence-update', handlePresence)
			socket?.off('presence-leave', handleLeave)
			socket?.off('title-change', handleTitleChange)
			socket?.off('connect', clearPresence)
			socket?.off('disconnect', clearPresence)
			clearPresence()
		}
	}, [getRevision, socket])

	useEffect(
		() => () => {
			cancelPendingEmit()
			cancelPendingTitle()
			if (enabledRef.current && socket?.connected) {
				socket.emit('presence-update', {
					field: 'idle',
					name: nameRef.current
				} satisfies RealtimePresenceUpdate)
			}
		},
		[cancelPendingEmit, cancelPendingTitle, socket]
	)

	return { remotePresence, publishPresence, publishTitleChange }
}
