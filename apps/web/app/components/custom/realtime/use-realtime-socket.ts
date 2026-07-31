'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import io, { type Socket } from 'socket.io-client'
import type { Syntax } from '../../../types'
import { getBaseApiUrl } from '../../../utils/functions'
import type {
	CodeChangeBatch,
	JoinRoomAck,
	RealtimeSnapshot,
	RealtimeWriteAck,
	RemoteCodeChange,
	RemoteContentChange,
	RemoteMetaChange,
	RemoteRevisionChange,
	SaveResult
} from './socket-contract'

const ACK_TIMEOUT_MS = 6000
const JOIN_RETRY_MS = 500

const emitWithAck = <Ack>(
	socket: Socket,
	event: string,
	payload?: unknown
): Promise<Ack | null> =>
	new Promise((resolve) => {
		let settled = false
		const timeout = window.setTimeout(() => {
			settled = true
			resolve(null)
		}, ACK_TIMEOUT_MS)

		const acknowledge = (ack: Ack) => {
			if (settled) return
			settled = true
			window.clearTimeout(timeout)
			resolve(ack)
		}

		if (payload === undefined) socket.emit(event, acknowledge)
		else socket.emit(event, payload, acknowledge)
	})

type UseRealtimeSocketOptions = {
	slug: string
	initialRevision: number
	onSnapshot: (snapshot: RealtimeSnapshot) => void
	onRemoteContent: (content: string) => void
	onRemoteMetadata: (title: string, syntax: Syntax, isSelf: boolean) => void
	onRemoteCodeChange: (change: CodeChangeBatch) => boolean
}

type QueuedOperation = (generation: number) => Promise<SaveResult>

export const useRealtimeSocket = ({
	slug,
	initialRevision,
	onSnapshot,
	onRemoteContent,
	onRemoteMetadata,
	onRemoteCodeChange
}: UseRealtimeSocketOptions) => {
	const [activeSocket, setActiveSocket] = useState<Socket | null>(null)
	const [isJoined, setIsJoined] = useState(false)
	const socketRef = useRef<Socket | null>(null)
	const revisionRef = useRef(initialRevision)
	const joinedRef = useRef(false)
	const generationRef = useRef(0)
	const connectionAttemptRef = useRef(0)
	const writeBlockedUntilRef = useRef(0)
	const operationQueueRef = useRef(Promise.resolve<SaveResult>('success'))
	const codeLaneBlockedRef = useRef(true)
	const requestResyncRef = useRef<() => void>(() => undefined)
	const onSnapshotRef = useRef(onSnapshot)
	const onRemoteContentRef = useRef(onRemoteContent)
	const onRemoteMetadataRef = useRef(onRemoteMetadata)
	const onRemoteCodeChangeRef = useRef(onRemoteCodeChange)

	onSnapshotRef.current = onSnapshot
	onRemoteContentRef.current = onRemoteContent
	onRemoteMetadataRef.current = onRemoteMetadata
	onRemoteCodeChangeRef.current = onRemoteCodeChange

	const applySnapshot = useCallback((snapshot: RealtimeSnapshot) => {
		generationRef.current += 1
		revisionRef.current = snapshot.revision
		onSnapshotRef.current(snapshot)
		codeLaneBlockedRef.current = !joinedRef.current
	}, [])

	useEffect(() => {
		joinedRef.current = false
		setIsJoined(false)
		revisionRef.current = initialRevision
		generationRef.current += 1
		codeLaneBlockedRef.current = true
		const socket = io(getBaseApiUrl(), {
			path: '/ws',
			withCredentials: true
		})
		let disposed = false
		let joinInFlightAttempt: number | null = null
		let joinTimer: number | null = null

		socketRef.current = socket
		setActiveSocket(socket)

		const clearJoinTimer = () => {
			if (joinTimer === null) return
			window.clearTimeout(joinTimer)
			joinTimer = null
		}

		const joinCurrentRoom = async (attempt: number) => {
			if (
				disposed ||
				!socket.connected ||
				attempt !== connectionAttemptRef.current ||
				joinInFlightAttempt === attempt
			) {
				return
			}

			joinInFlightAttempt = attempt
			const ack = await emitWithAck<JoinRoomAck>(socket, 'join-room', {
				slug
			})
			if (joinInFlightAttempt === attempt) joinInFlightAttempt = null

			if (
				disposed ||
				!socket.connected ||
				attempt !== connectionAttemptRef.current
			) {
				return
			}

			if (ack?.status === 'success') {
				revisionRef.current = ack.revision
				onSnapshotRef.current(ack.snapshot)
				joinedRef.current = true
				codeLaneBlockedRef.current = false
				setIsJoined(true)
				return
			}

			const retryAfter =
				ack?.status === 'rate_limited'
					? Math.max(ack.retryAfterMs, 1)
					: JOIN_RETRY_MS
			if (
				!ack ||
				ack.status === 'rate_limited' ||
				ack.status === 'internal_error'
			) {
				clearJoinTimer()
				joinTimer = window.setTimeout(
					() => void joinCurrentRoom(attempt),
					retryAfter
				)
			}
		}

		const startJoin = () => {
			if (disposed || !socket.connected) return
			clearJoinTimer()
			const attempt = connectionAttemptRef.current + 1
			connectionAttemptRef.current = attempt
			joinInFlightAttempt = null
			joinedRef.current = false
			setIsJoined(false)
			generationRef.current += 1
			codeLaneBlockedRef.current = true
			void joinCurrentRoom(attempt)
		}

		requestResyncRef.current = startJoin

		const handleDisconnect = () => {
			connectionAttemptRef.current += 1
			joinInFlightAttempt = null
			joinedRef.current = false
			setIsJoined(false)
			generationRef.current += 1
			codeLaneBlockedRef.current = true
			clearJoinTimer()
		}

		const handleCodeChange = (change: RemoteCodeChange) => {
			if (!joinedRef.current || change.sender === socket.id) return
			if (change.revision < revisionRef.current) return
			if (change.revision > revisionRef.current) {
				startJoin()
				return
			}
			if (!onRemoteCodeChangeRef.current(change)) startJoin()
		}

		const handleContentChange = (change: RemoteContentChange) => {
			if (!joinedRef.current || change.sender === socket.id) return
			if (change.revision <= revisionRef.current) return
			if (change.revision !== revisionRef.current + 1) {
				startJoin()
				return
			}

			generationRef.current += 1
			revisionRef.current = change.revision
			onRemoteContentRef.current(change.content)
			codeLaneBlockedRef.current = false
		}

		const handleMetaChange = (change: RemoteMetaChange) => {
			if (!joinedRef.current) return
			if (change.revision < revisionRef.current) return
			if (change.revision > revisionRef.current + 1) {
				startJoin()
				return
			}

			const isSelf = change.sender === socket.id
			revisionRef.current = Math.max(revisionRef.current, change.revision)
			if (isSelf) {
				onRemoteMetadataRef.current(change.title, change.syntax, true)
				return
			}

			onRemoteMetadataRef.current(change.title, change.syntax, false)
		}

		const handleRevisionChange = (change: RemoteRevisionChange) => {
			if (!joinedRef.current || change.revision < revisionRef.current)
				return
			revisionRef.current = Math.max(revisionRef.current, change.revision)
		}

		socket.on('connect', startJoin)
		socket.on('disconnect', handleDisconnect)
		socket.on('code-change', handleCodeChange)
		socket.on('content-change', handleContentChange)
		socket.on('meta-change', handleMetaChange)
		socket.on('revision-change', handleRevisionChange)
		if (socket.connected) startJoin()

		return () => {
			disposed = true
			requestResyncRef.current = () => undefined
			connectionAttemptRef.current += 1
			joinInFlightAttempt = null
			joinedRef.current = false
			generationRef.current += 1
			codeLaneBlockedRef.current = true
			clearJoinTimer()
			socket.off('connect', startJoin)
			socket.off('disconnect', handleDisconnect)
			socket.off('code-change', handleCodeChange)
			socket.off('content-change', handleContentChange)
			socket.off('meta-change', handleMetaChange)
			socket.off('revision-change', handleRevisionChange)
			if (socket.connected) socket.emit('leave-room', () => undefined)
			socket.disconnect()
			if (socketRef.current === socket) socketRef.current = null
		}
	}, [initialRevision, slug])

	const enqueueOperation = useCallback((operation: QueuedOperation) => {
		const generation = generationRef.current
		const queued = operationQueueRef.current.then(
			() => operation(generation),
			() => operation(generation)
		)
		operationQueueRef.current = queued
		return queued
	}, [])

	const getOperationSocket = useCallback((generation: number) => {
		const socket = socketRef.current
		if (
			generation !== generationRef.current ||
			!socket?.connected ||
			!joinedRef.current
		) {
			return null
		}
		return {
			socket,
			socketId: socket.id,
			attempt: connectionAttemptRef.current
		}
	}, [])

	const isCurrentOperation = useCallback(
		(
			generation: number,
			identity: NonNullable<ReturnType<typeof getOperationSocket>>
		) =>
			generation === generationRef.current &&
			socketRef.current === identity.socket &&
			identity.socket.connected &&
			identity.socket.id === identity.socketId &&
			connectionAttemptRef.current === identity.attempt &&
			joinedRef.current,
		[]
	)

	const sendCodeChange = useCallback(
		(batch: CodeChangeBatch) => {
			if (codeLaneBlockedRef.current) return

			const generation = generationRef.current
			const identity = getOperationSocket(generation)
			if (!identity) return
			const baseRevision = revisionRef.current

			const handleAcknowledgement = (ack: RealtimeWriteAck | null) => {
				if (
					!isCurrentOperation(generation, identity) ||
					codeLaneBlockedRef.current
				) {
					return
				}
				if (ack?.status === 'success') {
					revisionRef.current = Math.max(
						revisionRef.current,
						ack.revision
					)
					return
				}
				if (!ack) return

				codeLaneBlockedRef.current = true
				if (ack?.status === 'revision_conflict') {
					applySnapshot(ack.snapshot)
					return
				}
				requestResyncRef.current()
			}

			void emitWithAck<RealtimeWriteAck>(identity.socket, 'code-change', {
				changes: batch.changes,
				baseRevision
			}).then(handleAcknowledgement, () => handleAcknowledgement(null))
		},
		[applySnapshot, getOperationSocket, isCurrentOperation]
	)

	const enqueueWrite = useCallback(
		(
			event: 'content-sync' | 'meta-sync',
			payload: Record<string, unknown>
		): Promise<SaveResult> =>
			enqueueOperation(async (generation) => {
				const identity = getOperationSocket(generation)
				if (!identity) return 'discarded'
				if (Date.now() < writeBlockedUntilRef.current) {
					return 'retryable_error'
				}
				const baseRevision = revisionRef.current

				const ack = await emitWithAck<RealtimeWriteAck>(
					identity.socket,
					event,
					{
						...payload,
						baseRevision
					}
				)
				if (!isCurrentOperation(generation, identity))
					return 'discarded'

				if (ack?.status === 'success') {
					if (ack.revision !== baseRevision + 1) {
						requestResyncRef.current()
						return 'resynced'
					}
					revisionRef.current = Math.max(
						revisionRef.current,
						ack.revision
					)
					return 'success'
				}
				if (ack?.status === 'revision_conflict') {
					applySnapshot(ack.snapshot)
					return 'resynced'
				}
				if (ack?.status === 'rate_limited') {
					writeBlockedUntilRef.current = Date.now() + ack.retryAfterMs
					return 'retryable_error'
				}

				requestResyncRef.current()
				return 'resynced'
			}),
		[
			applySnapshot,
			enqueueOperation,
			getOperationSocket,
			isCurrentOperation
		]
	)

	const saveContent = useCallback(
		(content: string) => enqueueWrite('content-sync', { content }),
		[enqueueWrite]
	)

	const saveMetadata = useCallback(
		(title: string, syntaxName: string) =>
			enqueueWrite('meta-sync', { title, syntaxName }),
		[enqueueWrite]
	)

	const getRevision = useCallback(() => revisionRef.current, [])

	return {
		activeSocket,
		isJoined,
		sendCodeChange,
		saveContent,
		saveMetadata,
		getRevision
	}
}
