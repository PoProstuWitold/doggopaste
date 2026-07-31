import type { ServerType } from '@hono/node-server'
import { createMiddleware } from 'hono/factory'
import { type Socket, Server as WebSocketsServer } from 'socket.io'
import { origins } from '../utils/contants.js'
import {
	loadRealtimeSocketSnapshot,
	saveRealtimeContent,
	saveRealtimeMetadata
} from '../utils/realtime-persistence.js'
import {
	applyRealtimeCodeChanges,
	codeChangePayloadSchema,
	contentSyncPayloadSchema,
	cursorMovePayloadSchema,
	joinRoomPayloadSchema,
	liveTitleChangePayloadSchema,
	metaSyncPayloadSchema,
	presenceUpdatePayloadSchema,
	type RealtimeSocketSnapshot,
	SOCKET_LIMITS,
	type SocketAcknowledgement,
	type SocketAcknowledgementCallback,
	type SocketRateLimitEvent
} from '../utils/socket-contract.js'
import { SocketRateLimiter } from '../utils/socket-rate-limiter.js'

type RealtimeSocket = Socket & {
	data: {
		slug?: string
		joinedRevision?: number
	}
}

type RealtimeRoomState = RealtimeSocketSnapshot & {
	dirty: boolean
	contentVersion: number
	liveRevisionFloor: number
	liveTitle: string
	titleVersion: number
	flushAttempts: number
	orphanedAt?: number
}

const realtimeRoomStates = new Map<string, RealtimeRoomState>()
const realtimeRoomQueues = new Map<string, Promise<void>>()
const orphanedRoomTimers = new Map<string, ReturnType<typeof setTimeout>>()

let io: WebSocketsServer | null = null

const roomName = (slug: string) => `realtime:${slug}`

function toPublicSnapshot(
	state: RealtimeRoomState | RealtimeSocketSnapshot
): RealtimeSocketSnapshot {
	return {
		content: state.content,
		title: 'liveTitle' in state ? state.liveTitle : state.title,
		syntax: { ...state.syntax },
		revision: state.revision
	}
}

function toRoomState(snapshot: RealtimeSocketSnapshot): RealtimeRoomState {
	return {
		...toPublicSnapshot(snapshot),
		dirty: false,
		contentVersion: 0,
		liveRevisionFloor: snapshot.revision,
		liveTitle: snapshot.title,
		titleVersion: 0,
		flushAttempts: 0
	}
}

function clearOrphanedRoomTimer(slug: string): void {
	const timer = orphanedRoomTimers.get(slug)
	if (timer) clearTimeout(timer)
	orphanedRoomTimers.delete(slug)
}

function clearOrphanedState(slug: string, state: RealtimeRoomState): void {
	clearOrphanedRoomTimer(slug)
	state.flushAttempts = 0
	state.orphanedAt = undefined
}

async function runRoomTask<T>(
	slug: string,
	task: () => T | Promise<T>
): Promise<T> {
	const previous = realtimeRoomQueues.get(slug) ?? Promise.resolve()
	let release = () => {}
	const gate = new Promise<void>((resolve) => {
		release = resolve
	})
	const tail = previous.catch(() => {}).then(() => gate)
	realtimeRoomQueues.set(slug, tail)

	await previous.catch(() => {})
	try {
		return await task()
	} finally {
		release()
		if (realtimeRoomQueues.get(slug) === tail) {
			realtimeRoomQueues.delete(slug)
		}
	}
}

function revalidateQueuedRoom(
	socket: RealtimeSocket,
	slug: string,
	callback: unknown
): boolean {
	const activeSlug = socket.data.slug
	if (!activeSlug || !socket.rooms.has(roomName(activeSlug))) {
		acknowledge(callback, { status: 'not_joined' })
		return false
	}
	if (activeSlug !== slug || !socket.rooms.has(roomName(slug))) {
		acknowledge(callback, { status: 'room_mismatch' })
		return false
	}
	return true
}

async function flushDirtyRoomState(
	slug: string,
	state: RealtimeRoomState
): Promise<boolean> {
	if (!state.dirty) return true

	const result = await saveRealtimeContent(
		slug,
		state.content,
		state.revision
	)
	if (result.status === 'success') {
		state.revision = result.revision
		state.liveRevisionFloor = result.revision
		state.dirty = false
		clearOrphanedState(slug, state)
		return true
	}
	if (result.status === 'revision_conflict') {
		clearOrphanedRoomTimer(slug)
		realtimeRoomStates.set(slug, toRoomState(result.snapshot))
		return true
	}
	return false
}

function deleteRoomState(slug: string): void {
	clearOrphanedRoomTimer(slug)
	realtimeRoomStates.delete(slug)
}

function enforceOrphanedRoomCap(): void {
	const orphaned = [...realtimeRoomStates.entries()]
		.filter(([, state]) => state.orphanedAt !== undefined)
		.sort(
			([, first], [, second]) =>
				(first.orphanedAt ?? 0) - (second.orphanedAt ?? 0)
		)
	while (orphaned.length > SOCKET_LIMITS.orphanedRoom.maxEntries) {
		const oldest = orphaned.shift()
		if (oldest) deleteRoomState(oldest[0])
	}
}

function scheduleOrphanedRoomRetry(
	server: WebSocketsServer,
	slug: string,
	state: RealtimeRoomState
): void {
	clearOrphanedRoomTimer(slug)
	const orphanedAt = state.orphanedAt ?? Date.now()
	state.orphanedAt = orphanedAt
	const age = Date.now() - orphanedAt
	const attemptsRemaining =
		state.flushAttempts < SOCKET_LIMITS.orphanedRoom.maxAttempts
	const delay = attemptsRemaining
		? SOCKET_LIMITS.orphanedRoom.retryBaseMs *
			2 ** Math.max(0, state.flushAttempts - 1)
		: Math.max(1, SOCKET_LIMITS.orphanedRoom.ttlMs - age)

	const timer = setTimeout(() => {
		orphanedRoomTimers.delete(slug)
		void runRoomTask(slug, async () => {
			const current = realtimeRoomStates.get(slug)
			if (current !== state) return
			if (server.sockets.adapter.rooms.has(roomName(slug))) {
				clearOrphanedState(slug, state)
				return
			}
			if (Date.now() - orphanedAt >= SOCKET_LIMITS.orphanedRoom.ttlMs) {
				deleteRoomState(slug)
				return
			}
			if (!attemptsRemaining) {
				scheduleOrphanedRoomRetry(server, slug, state)
				return
			}

			try {
				if (await flushDirtyRoomState(slug, state)) {
					cleanupRoomState(server, slug)
					return
				}
			} catch {
				// The bounded retry below preserves the in-memory snapshot temporarily.
			}
			state.flushAttempts += 1
			scheduleOrphanedRoomRetry(server, slug, state)
		}).catch(() => {})
	}, delay)
	timer.unref()
	orphanedRoomTimers.set(slug, timer)
}

function retainOrphanedDirtyState(
	server: WebSocketsServer,
	slug: string,
	state: RealtimeRoomState
): void {
	state.orphanedAt ??= Date.now()
	state.flushAttempts += 1
	scheduleOrphanedRoomRetry(server, slug, state)
	enforceOrphanedRoomCap()
}

function acknowledge(
	callback: unknown,
	acknowledgement: SocketAcknowledgement
): void {
	if (typeof callback === 'function') {
		;(callback as SocketAcknowledgementCallback)(acknowledgement)
	}
}

function checkRateLimit(
	limiter: SocketRateLimiter,
	event: SocketRateLimitEvent,
	callback: unknown
): boolean {
	const result = limiter.consume(event)
	if (result.allowed) return true

	acknowledge(callback, {
		status: 'rate_limited',
		retryAfterMs: result.retryAfterMs
	})
	return false
}

function resolveBoundSlug(
	socket: RealtimeSocket,
	payload: { slug?: string },
	callback: unknown
): string | null {
	const slug = socket.data.slug
	if (!slug || !socket.rooms.has(roomName(slug))) {
		socket.data.slug = undefined
		socket.data.joinedRevision = undefined
		acknowledge(callback, { status: 'not_joined' })
		return null
	}

	if (payload.slug && payload.slug !== slug) {
		acknowledge(callback, { status: 'room_mismatch' })
		return null
	}

	return slug
}

function cleanupRoomState(server: WebSocketsServer, slug: string): void {
	if (!server.sockets.adapter.rooms.has(roomName(slug))) {
		const state = realtimeRoomStates.get(slug)
		if (!state?.dirty) deleteRoomState(slug)
	}
}

function emitSocketLeave(socket: RealtimeSocket, slug: string): void {
	const room = roomName(slug)
	socket.to(room).emit('cursor-leave', { id: socket.id })
	socket.to(room).emit('presence-leave', { id: socket.id })
}

function broadcastConflictSnapshot(
	socket: RealtimeSocket,
	slug: string,
	snapshot: RealtimeSocketSnapshot
): void {
	const room = roomName(slug)
	socket.to(room).emit('content-change', {
		content: snapshot.content,
		revision: snapshot.revision,
		sender: socket.id
	})
	socket.to(room).emit('meta-change', {
		title: snapshot.title,
		syntax: snapshot.syntax,
		revision: snapshot.revision,
		sender: socket.id
	})
}

function broadcastRevisionChange(
	socket: RealtimeSocket,
	slug: string,
	revision: number,
	kind: 'content' | 'metadata'
): void {
	socket.to(roomName(slug)).emit('revision-change', {
		revision,
		sender: socket.id,
		kind
	})
}

async function leaveCurrentRoom(
	server: WebSocketsServer,
	socket: RealtimeSocket
): Promise<number | undefined> {
	const slug = socket.data.slug
	if (!slug) return undefined
	emitSocketLeave(socket, slug)
	socket.data.slug = undefined
	socket.data.joinedRevision = undefined
	await socket.leave(roomName(slug))

	return runRoomTask(slug, async () => {
		const state = realtimeRoomStates.get(slug)
		const hasMembers = server.sockets.adapter.rooms.has(roomName(slug))
		let flushFailed = false
		if (state?.dirty && !hasMembers) {
			try {
				flushFailed = !(await flushDirtyRoomState(slug, state))
			} catch {
				flushFailed = true
			}
		}

		if (flushFailed && state.dirty) {
			retainOrphanedDirtyState(server, slug, state)
		}
		const revision =
			realtimeRoomStates.get(slug)?.revision ?? state?.revision
		cleanupRoomState(server, slug)
		return revision
	})
}

export function initWebSockets(server: ServerType): WebSocketsServer {
	const socketServer = new WebSocketsServer(server, {
		path: '/ws',
		cors: {
			origin: origins,
			credentials: true
		},
		maxHttpBufferSize: SOCKET_LIMITS.maxHttpBufferSize
	})
	io = socketServer

	socketServer.on('error', () => {
		console.error('[WS] Server error')
	})

	socketServer.on('connection', (rawSocket) => {
		const socket = rawSocket as RealtimeSocket
		const limiter = new SocketRateLimiter()
		let disconnectedSlug: string | undefined
		let joinAttempt = 0

		console.info(`Socket ${socket.id} connected!`)

		socket.on('join-room', async (payload: unknown, callback?: unknown) => {
			if (!checkRateLimit(limiter, 'joinRoom', callback)) return
			const parsed = joinRoomPayloadSchema.safeParse(payload)
			if (!parsed.success) {
				acknowledge(callback, { status: 'validation_error' })
				return
			}

			const { slug } = parsed.data
			const attempt = ++joinAttempt
			const isCurrentAttempt = () =>
				socket.connected && attempt === joinAttempt
			const rejectSupersededAttempt = () => {
				if (isCurrentAttempt()) return false
				if (socket.connected) {
					acknowledge(callback, { status: 'room_mismatch' })
				}
				return true
			}
			try {
				const preflightSnapshot = await loadRealtimeSocketSnapshot(slug)
				if (rejectSupersededAttempt()) return
				if (!preflightSnapshot) {
					acknowledge(callback, { status: 'validation_error' })
					return
				}

				if (socket.data.slug !== slug) {
					await leaveCurrentRoom(socketServer, socket)
					if (rejectSupersededAttempt()) return
				}

				await runRoomTask(slug, async () => {
					if (rejectSupersededAttempt()) return
					const latestSnapshot =
						await loadRealtimeSocketSnapshot(slug)
					if (rejectSupersededAttempt()) return
					if (!latestSnapshot) {
						acknowledge(callback, { status: 'validation_error' })
						return
					}
					await socket.join(roomName(slug))
					if (rejectSupersededAttempt()) {
						await socket.leave(roomName(slug))
						cleanupRoomState(socketServer, slug)
						return
					}
					socket.data.slug = slug

					const existingState = realtimeRoomStates.get(slug)
					let activeSnapshot = existingState
					if (
						!existingState ||
						latestSnapshot.revision > existingState.revision
					) {
						activeSnapshot = toRoomState(latestSnapshot)
						realtimeRoomStates.set(slug, activeSnapshot)
					}
					clearOrphanedState(slug, activeSnapshot)
					socket.data.joinedRevision = activeSnapshot.revision

					const acknowledgementSnapshot =
						toPublicSnapshot(activeSnapshot)
					console.info(`Socket ${socket.id} joined room ${slug}`)
					acknowledge(callback, {
						status: 'success',
						revision: acknowledgementSnapshot.revision,
						snapshot: acknowledgementSnapshot
					})
				})
			} catch {
				console.error(`[WS] Failed to join room ${slug}`)
				acknowledge(callback, { status: 'internal_error' })
			}
		})

		socket.on('leave-room', async (...args: unknown[]) => {
			const callback = args.findLast(
				(argument) => typeof argument === 'function'
			)
			if (args.some((argument) => typeof argument !== 'function')) {
				acknowledge(callback, { status: 'validation_error' })
				return
			}
			if (!socket.data.slug) {
				acknowledge(callback, { status: 'not_joined' })
				return
			}

			try {
				const revision = await leaveCurrentRoom(socketServer, socket)
				acknowledge(callback, { status: 'success', revision })
			} catch {
				acknowledge(callback, { status: 'internal_error' })
			}
		})

		socket.on('code-change', (payload: unknown, callback?: unknown) => {
			if (!checkRateLimit(limiter, 'codeChange', callback)) return
			const parsed = codeChangePayloadSchema.safeParse(payload)
			if (!parsed.success) {
				acknowledge(callback, { status: 'validation_error' })
				return
			}

			const slug = resolveBoundSlug(socket, parsed.data, callback)
			if (!slug) return

			const state = realtimeRoomStates.get(slug)
			if (!state) {
				acknowledge(callback, { status: 'internal_error' })
				return
			}
			const minimumRevision = Math.max(
				state.liveRevisionFloor,
				socket.data.joinedRevision ?? state.revision
			)
			if (
				parsed.data.baseRevision < minimumRevision ||
				parsed.data.baseRevision > state.revision
			) {
				const snapshot = toPublicSnapshot(state)
				acknowledge(callback, {
					status: 'revision_conflict',
					revision: snapshot.revision,
					snapshot
				})
				return
			}

			const nextContent = applyRealtimeCodeChanges(
				state.content,
				parsed.data.changes
			)
			if (nextContent === null) {
				acknowledge(callback, { status: 'validation_error' })
				return
			}

			state.content = nextContent
			state.contentVersion += 1
			state.dirty = true
			clearOrphanedState(slug, state)
			socket.to(roomName(slug)).emit('code-change', {
				changes: parsed.data.changes,
				sender: socket.id,
				revision: state.revision
			})
			acknowledge(callback, {
				status: 'success',
				revision: state.revision
			})
		})

		socket.on(
			'content-sync',
			async (payload: unknown, callback?: unknown) => {
				if (!checkRateLimit(limiter, 'contentSync', callback)) return
				const parsed = contentSyncPayloadSchema.safeParse(payload)
				if (!parsed.success) {
					acknowledge(callback, { status: 'validation_error' })
					return
				}

				const slug = resolveBoundSlug(socket, parsed.data, callback)
				if (!slug) return
				const capturedState = realtimeRoomStates.get(slug)
				if (!capturedState) {
					acknowledge(callback, { status: 'internal_error' })
					return
				}
				if (
					parsed.data.baseRevision !== capturedState.revision ||
					parsed.data.content !== capturedState.content
				) {
					const snapshot = toPublicSnapshot(capturedState)
					acknowledge(callback, {
						status: 'revision_conflict',
						revision: snapshot.revision,
						snapshot
					})
					return
				}
				const capturedContent = parsed.data.content
				const capturedContentVersion = capturedState.contentVersion

				try {
					await runRoomTask(slug, async () => {
						if (!revalidateQueuedRoom(socket, slug, callback))
							return
						const roomState = realtimeRoomStates.get(slug)
						if (roomState !== capturedState) {
							if (!roomState) {
								acknowledge(callback, {
									status: 'internal_error'
								})
								return
							}
							const snapshot = toPublicSnapshot(roomState)
							acknowledge(callback, {
								status: 'revision_conflict',
								revision: snapshot.revision,
								snapshot
							})
							return
						}
						if (parsed.data.baseRevision !== roomState.revision) {
							const snapshot = toPublicSnapshot(roomState)
							acknowledge(callback, {
								status: 'revision_conflict',
								revision: snapshot.revision,
								snapshot
							})
							return
						}

						const result = await saveRealtimeContent(
							slug,
							capturedContent,
							parsed.data.baseRevision
						)
						if (result.status === 'success') {
							roomState.revision = result.revision
							roomState.dirty =
								roomState.contentVersion !==
									capturedContentVersion ||
								roomState.content !== capturedContent
							clearOrphanedState(slug, roomState)
							broadcastRevisionChange(
								socket,
								slug,
								result.revision,
								'content'
							)
							acknowledge(callback, {
								status: 'success',
								revision: result.revision
							})
							return
						}

						if (result.status === 'revision_conflict') {
							realtimeRoomStates.set(
								slug,
								toRoomState(result.snapshot)
							)
							broadcastConflictSnapshot(
								socket,
								slug,
								result.snapshot
							)
							acknowledge(callback, {
								status: 'revision_conflict',
								revision: result.snapshot.revision,
								snapshot: result.snapshot
							})
							return
						}

						acknowledge(callback, { status: 'internal_error' })
					})
				} catch {
					console.error(`[WS] Failed to sync content for ${slug}`)
					acknowledge(callback, { status: 'internal_error' })
				}
			}
		)

		socket.on('meta-sync', async (payload: unknown, callback?: unknown) => {
			if (!checkRateLimit(limiter, 'metaSync', callback)) return
			const parsed = metaSyncPayloadSchema.safeParse(payload)
			if (!parsed.success) {
				acknowledge(callback, { status: 'validation_error' })
				return
			}

			const slug = resolveBoundSlug(socket, parsed.data, callback)
			if (!slug) return
			const capturedState = realtimeRoomStates.get(slug)
			if (!capturedState) {
				acknowledge(callback, { status: 'internal_error' })
				return
			}
			if (parsed.data.baseRevision !== capturedState.revision) {
				const snapshot = toPublicSnapshot(capturedState)
				acknowledge(callback, {
					status: 'revision_conflict',
					revision: snapshot.revision,
					snapshot
				})
				return
			}
			const capturedTitleVersion = capturedState.titleVersion

			try {
				await runRoomTask(slug, async () => {
					if (!revalidateQueuedRoom(socket, slug, callback)) return
					const roomState = realtimeRoomStates.get(slug)
					if (roomState !== capturedState) {
						if (!roomState) {
							acknowledge(callback, { status: 'internal_error' })
							return
						}
						const snapshot = toPublicSnapshot(roomState)
						acknowledge(callback, {
							status: 'revision_conflict',
							revision: snapshot.revision,
							snapshot
						})
						return
					}
					if (parsed.data.baseRevision !== roomState.revision) {
						const snapshot = toPublicSnapshot(roomState)
						acknowledge(callback, {
							status: 'revision_conflict',
							revision: snapshot.revision,
							snapshot
						})
						return
					}

					const result = await saveRealtimeMetadata(
						slug,
						parsed.data.title,
						parsed.data.syntaxName,
						parsed.data.baseRevision
					)
					if (result.status === 'success') {
						roomState.revision = result.revision
						roomState.title = result.title
						if (roomState.titleVersion === capturedTitleVersion) {
							roomState.liveTitle = result.title
						}
						roomState.syntax = result.syntax
						broadcastRevisionChange(
							socket,
							slug,
							result.revision,
							'metadata'
						)
						clearOrphanedState(slug, roomState)
						socketServer.to(roomName(slug)).emit('meta-change', {
							title: roomState.liveTitle,
							syntax: result.syntax,
							revision: result.revision,
							sender: socket.id
						})
						acknowledge(callback, {
							status: 'success',
							revision: result.revision
						})
						return
					}

					if (result.status === 'revision_conflict') {
						realtimeRoomStates.set(
							slug,
							toRoomState(result.snapshot)
						)
						broadcastConflictSnapshot(socket, slug, result.snapshot)
						acknowledge(callback, {
							status: 'revision_conflict',
							revision: result.snapshot.revision,
							snapshot: result.snapshot
						})
						return
					}

					acknowledge(callback, {
						status:
							result.status === 'invalid_syntax'
								? 'validation_error'
								: 'internal_error'
					})
				})
			} catch {
				console.error(`[WS] Failed to sync metadata for ${slug}`)
				acknowledge(callback, { status: 'internal_error' })
			}
		})

		socket.on('title-change', (payload: unknown, callback?: unknown) => {
			if (!checkRateLimit(limiter, 'titleChange', callback)) return
			const parsed = liveTitleChangePayloadSchema.safeParse(payload)
			if (!parsed.success) {
				acknowledge(callback, { status: 'validation_error' })
				return
			}

			const slug = resolveBoundSlug(socket, parsed.data, callback)
			if (!slug) return
			const state = realtimeRoomStates.get(slug)
			if (!state) {
				acknowledge(callback, { status: 'internal_error' })
				return
			}

			state.liveTitle = parsed.data.title
			state.titleVersion += 1
			socket.volatile.to(roomName(slug)).emit('title-change', {
				title: parsed.data.title,
				sender: socket.id,
				revision: state.revision
			})
			acknowledge(callback, {
				status: 'success',
				revision: state.revision
			})
		})

		socket.on('presence-update', (payload: unknown, callback?: unknown) => {
			if (!checkRateLimit(limiter, 'presenceUpdate', callback)) return
			const parsed = presenceUpdatePayloadSchema.safeParse(payload)
			if (!parsed.success) {
				acknowledge(callback, { status: 'validation_error' })
				return
			}

			const slug = resolveBoundSlug(socket, parsed.data, callback)
			if (!slug) return

			const state = realtimeRoomStates.get(slug)
			if (!state) {
				acknowledge(callback, { status: 'internal_error' })
				return
			}
			if (parsed.data.field === 'content') {
				const maximumPosition = state.content.length
				if (
					parsed.data.selection.anchor > maximumPosition ||
					parsed.data.selection.head > maximumPosition
				) {
					acknowledge(callback, { status: 'validation_error' })
					return
				}
			}

			const { slug: _legacySlug, ...presence } = parsed.data
			const broadcast = {
				...presence,
				id: socket.id,
				revision: state.revision
			}
			const room = roomName(slug)
			if (
				parsed.data.field === 'content' ||
				parsed.data.field === 'title'
			) {
				socket.volatile.to(room).emit('presence-update', broadcast)
			} else {
				socket.to(room).emit('presence-update', broadcast)
			}
			acknowledge(callback, {
				status: 'success',
				revision: state.revision
			})
		})

		socket.on('cursor-move', (payload: unknown, callback?: unknown) => {
			if (!checkRateLimit(limiter, 'cursorMove', callback)) return
			const parsed = cursorMovePayloadSchema.safeParse(payload)
			if (!parsed.success) {
				acknowledge(callback, { status: 'validation_error' })
				return
			}

			const slug = resolveBoundSlug(socket, parsed.data, callback)
			if (!slug) return

			const state = realtimeRoomStates.get(slug)
			const { position, selection } = parsed.data
			if (
				!state ||
				position > state.content.length ||
				selection.anchor > state.content.length ||
				selection.head > state.content.length
			) {
				acknowledge(callback, { status: 'validation_error' })
				return
			}

			const { slug: _legacySlug, ...cursor } = parsed.data
			socket.volatile.to(roomName(slug)).emit('cursor-move', {
				...cursor,
				id: socket.id,
				revision: state.revision
			})
			acknowledge(callback, {
				status: 'success',
				revision: state.revision
			})
		})

		socket.on('disconnecting', () => {
			joinAttempt += 1
			disconnectedSlug = socket.data.slug
			if (disconnectedSlug) {
				emitSocketLeave(socket, disconnectedSlug)
				socket.data.slug = undefined
				socket.data.joinedRevision = undefined
			}
			limiter.clear()
		})

		socket.on('disconnect', (reason) => {
			const slug = disconnectedSlug
			if (slug) {
				void runRoomTask(slug, async () => {
					const hasMembers = socketServer.sockets.adapter.rooms.has(
						roomName(slug)
					)
					const state = realtimeRoomStates.get(slug)
					if (!hasMembers && state?.dirty) {
						let flushFailed = false
						try {
							flushFailed = !(await flushDirtyRoomState(
								slug,
								state
							))
						} catch {
							flushFailed = true
						}
						if (flushFailed && state.dirty) {
							retainOrphanedDirtyState(socketServer, slug, state)
						}
					}
					cleanupRoomState(socketServer, slug)
				}).catch(() => {})
			}
			console.info(`Socket ${socket.id} disconnected! Reason '${reason}'`)
		})
	})

	return socketServer
}

export async function closeWebSockets(): Promise<void> {
	const socketServer = io
	io = null
	if (socketServer) {
		await new Promise<void>((resolve) => {
			socketServer.close(() => resolve())
		})
	}
	await Promise.allSettled([...realtimeRoomQueues.values()])
	for (const timer of orphanedRoomTimers.values()) clearTimeout(timer)
	orphanedRoomTimers.clear()
	await Promise.allSettled(
		[...realtimeRoomStates.entries()]
			.filter(([, state]) => state.dirty)
			.map(([slug, state]) =>
				runRoomTask(slug, () => flushDirtyRoomState(slug, state))
			)
	)
	await Promise.allSettled([...realtimeRoomQueues.values()])
	realtimeRoomStates.clear()
	realtimeRoomQueues.clear()
}

export const wsMiddleware = createMiddleware<{
	Variables: {
		io: WebSocketsServer
	}
}>(async (c, next) => {
	if (!c.var.io && io) {
		c.set('io', io)
	}
	await next()
})
