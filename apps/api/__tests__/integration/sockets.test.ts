// biome-ignore-all lint: socket contract tests intentionally use a small structural client type
import { deepStrictEqual, notStrictEqual, ok, strictEqual } from 'node:assert'
import { randomUUID } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import { realTimePastesTable } from '../../src/db/schema.js'
import {
	closeWebSockets,
	initWebSockets
} from '../../src/middlewares/sockets.js'
import {
	SOCKET_LIMITS,
	type SocketAcknowledgement
} from '../../src/utils/socket-contract.js'
import { prepareDb } from '../test-utils.js'

type Listener = (...arguments_: any[]) => void

interface TestSocket {
	id?: string
	connected: boolean
	connect(): TestSocket
	disconnect(): TestSocket
	emit(event: string, ...arguments_: unknown[]): TestSocket
	on(event: string, listener: Listener): TestSocket
	once(event: string, listener: Listener): TestSocket
	off(event: string, listener?: Listener): TestSocket
}

type SocketFactory = (
	url: string,
	options: Record<string, unknown>
) => TestSocket

const requireFromWeb = createRequire(
	fileURLToPath(new URL('../../../web/package.json', import.meta.url))
)
const { io: createSocketClient } = requireFromWeb('socket.io-client') as {
	io: SocketFactory
}

const ACK_TIMEOUT_MS = 3000
const EVENT_TIMEOUT_MS = 1500

const delay = (milliseconds: number) =>
	new Promise((resolve) => setTimeout(resolve, milliseconds))

async function waitUntil(
	predicate: () => Promise<boolean>,
	timeoutMs = ACK_TIMEOUT_MS
): Promise<void> {
	const deadline = Date.now() + timeoutMs
	while (!(await predicate())) {
		if (Date.now() >= deadline) {
			throw new Error('Timed out waiting for the expected server state')
		}
		await delay(25)
	}
}

function uniqueSlug(prefix: string): string {
	return `ws-${prefix}-${randomUUID().replaceAll('-', '')}`
}

function emitAck(
	socket: TestSocket,
	event: string,
	payload?: unknown
): Promise<SocketAcknowledgement> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(
			() => reject(new Error(`Timed out waiting for ${event} acknowledgement`)),
			ACK_TIMEOUT_MS
		)
		const acknowledge = (acknowledgement: SocketAcknowledgement) => {
			clearTimeout(timeout)
			resolve(acknowledgement)
		}

		if (payload === undefined) socket.emit(event, acknowledge)
		else socket.emit(event, payload, acknowledge)
	})
}

function waitForEvent<T>(socket: TestSocket, event: string): Promise<T> {
	return new Promise((resolve, reject) => {
		const listener = (payload: T) => {
			clearTimeout(timeout)
			socket.off(event, listener)
			resolve(payload)
		}
		const timeout = setTimeout(() => {
			socket.off(event, listener)
			reject(new Error(`Timed out waiting for ${event}`))
		}, EVENT_TIMEOUT_MS)

		socket.on(event, listener)
	})
}

async function assertNoEvent(
	socket: TestSocket,
	event: string,
	action: () => Promise<void>
): Promise<void> {
	let received = false
	const listener = () => {
		received = true
	}
	socket.on(event, listener)
	try {
		await action()
		await delay(75)
		strictEqual(received, false, `Unexpected ${event} broadcast`)
	} finally {
		socket.off(event, listener)
	}
}

async function listen(server: Server): Promise<number> {
	await new Promise<void>((resolve, reject) => {
		const onError = (error: Error) => reject(error)
		server.once('error', onError)
		server.listen(0, '127.0.0.1', () => {
			server.off('error', onError)
			resolve()
		})
	})

	const address = server.address()
	if (!address || typeof address === 'string') {
		throw new Error('Socket test server did not expose a TCP port')
	}
	return address.port
}

async function connectClient(url: string): Promise<TestSocket> {
	const socket = createSocketClient(url, {
		autoConnect: false,
		forceNew: true,
		path: '/ws',
		reconnection: false,
		transports: ['websocket']
	})

	const connected = new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error('Timed out connecting Socket.IO client'))
		}, EVENT_TIMEOUT_MS)
		const onConnect = () => {
			clearTimeout(timeout)
			socket.off('connect_error', onError)
			resolve()
		}
		const onError = (error: Error) => {
			clearTimeout(timeout)
			socket.off('connect', onConnect)
			reject(error)
		}
		socket.once('connect', onConnect)
		socket.once('connect_error', onError)
	})
	socket.connect()
	await connected
	return socket
}

function codeChange(
	baseRevision: number,
	from: number,
	to: number,
	insert: string,
	extra: Record<string, unknown> = {}
) {
	return {
		baseRevision,
		changes: [{ from, to, insert }],
		...extra
	}
}

function cursorPayload(position = 0) {
	return {
		x: 10,
		y: 20,
		name: 'Socket tester',
		viewportWidth: 1280,
		viewportHeight: 720,
		position,
		selection: { anchor: position, head: position }
	}
}

test('Socket.IO realtime contract', { concurrency: false }, async (t) => {
	await prepareDb()
	const server = createServer()
	const sockets = new Set<TestSocket>()
	const slugs = new Set<string>()
	initWebSockets(server)
	const port = await listen(server)
	const socketUrl = `http://127.0.0.1:${port}`

	const createClient = async () => {
		const socket = await connectClient(socketUrl)
		sockets.add(socket)
		return socket
	}
	const createPaste = async (prefix: string, content = '') => {
		const slug = uniqueSlug(prefix)
		await db.insert(realTimePastesTable).values({
			slug,
			title: slug,
			content
		})
		slugs.add(slug)
		return slug
	}
	const join = (socket: TestSocket, slug: string) =>
		emitAck(socket, 'join-room', { slug })

	try {
		await t.test('public join validates slug and returns initial revision', async () => {
			const slug = await createPaste('public')
			const socket = await createClient()

			const acknowledgement = await join(socket, slug)
			strictEqual(acknowledgement.status, 'success')
			if (acknowledgement.status === 'success') {
				strictEqual(acknowledgement.revision, 0)
				strictEqual(acknowledgement.snapshot?.content, '')
				strictEqual(acknowledgement.snapshot?.revision, 0)
			}

			strictEqual(
				(await join(socket, 'invalid_slug')).status,
				'validation_error'
			)
			strictEqual(
				(await join(socket, uniqueSlug('missing'))).status,
				'validation_error'
			)
		})

		await t.test('pre-join and malformed events are rejected without broadcast', async () => {
			const slug = await createPaste('validation', 'abc')
			const sender = await createClient()
			const observer = await createClient()

			strictEqual(
				(
					await emitAck(sender, 'content-sync', {
						content: 'abc',
						baseRevision: 0
					})
				).status,
				'not_joined'
			)
			strictEqual(
				(await emitAck(sender, 'code-change', codeChange(0, 0, 0, '')))
					.status,
				'not_joined'
			)
			strictEqual(
				(await emitAck(sender, 'cursor-move', cursorPayload())).status,
				'not_joined'
			)
			strictEqual(
				(await emitAck(sender, 'meta-sync', { title: 123 })).status,
				'validation_error'
			)
			strictEqual(
				(
					await emitAck(sender, 'content-sync', {
						content: 'x'.repeat(SOCKET_LIMITS.maxDocumentLength + 1),
						baseRevision: 0
					})
				).status,
				'validation_error'
			)

			await join(sender, slug)
			await join(observer, slug)
			strictEqual(
				(
					await emitAck(sender, 'cursor-move', {
						...cursorPayload(),
						position: -1
					})
				).status,
				'validation_error'
			)
			strictEqual(
				(await emitAck(sender, 'cursor-move', cursorPayload(4))).status,
				'validation_error'
			)

			await assertNoEvent(observer, 'code-change', async () => {
				strictEqual(
					(
						await emitAck(
							sender,
							'code-change',
							codeChange(0, 4, 4, 'invalid')
						)
					).status,
					'validation_error'
				)
			})
		})

		await t.test('room binding, switching, leave and sender ownership are enforced', async () => {
			const firstSlug = await createPaste('room-a', 'abc')
			const secondSlug = await createPaste('room-b', 'xyz')
			const writer = await createClient()
			const firstObserver = await createClient()
			const secondObserver = await createClient()
			await join(writer, firstSlug)
			await join(firstObserver, firstSlug)
			await join(secondObserver, secondSlug)

			const receivedChange = waitForEvent<{
				changes: Array<{ from: number; to: number; insert: string }>
				sender: string
				revision: number
			}>(firstObserver, 'code-change')
			const spoofAck = await emitAck(writer, 'code-change', {
				...codeChange(0, 3, 3, '!'),
				sender: 'spoofed-client',
				slug: firstSlug
			})
			strictEqual(spoofAck.status, 'success')
			const change = await receivedChange
			strictEqual(change.sender, writer.id)
			notStrictEqual(change.sender, 'spoofed-client')
			deepStrictEqual(change.changes, [{ from: 3, to: 3, insert: '!' }])

			await assertNoEvent(secondObserver, 'code-change', async () => {
				strictEqual(
					(
						await emitAck(
							writer,
							'code-change',
							codeChange(0, 4, 4, '?', { slug: secondSlug })
						)
					).status,
					'room_mismatch'
				)
			})

			const leftFirstRoom = waitForEvent<{ id: string }>(
				firstObserver,
				'cursor-leave'
			)
			const switchAck = await join(writer, secondSlug)
			strictEqual(switchAck.status, 'success')
			strictEqual((await leftFirstRoom).id, writer.id)

			let leakedToFirstRoom = false
			const firstRoomListener = () => {
				leakedToFirstRoom = true
			}
			firstObserver.on('code-change', firstRoomListener)
			const secondRoomChange = waitForEvent(secondObserver, 'code-change')
			strictEqual(
				(
					await emitAck(
						writer,
						'code-change',
						codeChange(0, 3, 3, '!')
					)
				).status,
				'success'
			)
			await secondRoomChange
			await delay(75)
			firstObserver.off('code-change', firstRoomListener)
			strictEqual(leakedToFirstRoom, false)

			const leaveAcknowledgement = emitAck(writer, 'leave-room')
			const queuedAfterLeave = emitAck(
				writer,
				'code-change',
				codeChange(0, 0, 0, '')
			)
			strictEqual((await leaveAcknowledgement).status, 'success')
			strictEqual((await queuedAfterLeave).status, 'not_joined')
		})

		await t.test('the latest concurrent join attempt owns the socket', async () => {
			const firstSlug = await createPaste('join-race-a')
			const secondSlug = await createPaste('join-race-b')
			const socket = await createClient()

			const firstJoin = join(socket, firstSlug)
			const secondJoin = join(socket, secondSlug)
			const [firstAcknowledgement, secondAcknowledgement] =
				await Promise.all([firstJoin, secondJoin])
			ok(
				firstAcknowledgement.status === 'success' ||
					firstAcknowledgement.status === 'room_mismatch'
			)
			strictEqual(secondAcknowledgement.status, 'success')
			strictEqual(
				(
					await emitAck(socket, 'code-change', {
						...codeChange(0, 0, 0, 'wrong room'),
						slug: firstSlug
					})
				).status,
				'room_mismatch'
			)
			strictEqual(
				(
					await emitAck(socket, 'code-change', {
						...codeChange(0, 0, 0, 'right room'),
						slug: secondSlug
					})
				).status,
				'success'
			)
		})

		await t.test('live snapshots, reconnect and cursor cleanup stay room-scoped', async () => {
			const firstSlug = await createPaste('live', 'abcdef')
			const secondSlug = await createPaste('live-switch')
			const first = await createClient()
			const observer = await createClient()
			await join(first, firstSlug)
			await join(observer, firstSlug)

			const liveEvent = waitForEvent<{
				changes: Array<{ from: number; to: number; insert: string }>
			}>(observer, 'code-change')
			const batchedChanges = [
				{ from: 1, to: 2, insert: 'B' },
				{ from: 4, to: 6, insert: 'EF' }
			]
			strictEqual(
				(
					await emitAck(first, 'code-change', {
						baseRevision: 0,
						changes: batchedChanges
					})
				).status,
				'success'
			)
			deepStrictEqual((await liveEvent).changes, batchedChanges)

			const lateJoiner = await createClient()
			const lateJoin = await join(lateJoiner, firstSlug)
			strictEqual(lateJoin.status, 'success')
			if (lateJoin.status === 'success') {
				strictEqual(lateJoin.snapshot?.content, 'aBcdEF')
				strictEqual(lateJoin.revision, 0)
			}

			const cursorEvent = waitForEvent<{ id: string }>(observer, 'cursor-move')
			strictEqual(
				(await emitAck(first, 'cursor-move', cursorPayload(4))).status,
				'success'
			)
			strictEqual((await cursorEvent).id, first.id)
			const disconnectedId = first.id
			const cursorLeave = waitForEvent<{ id: string }>(observer, 'cursor-leave')
			first.disconnect()
			strictEqual((await cursorLeave).id, disconnectedId)

			const reconnected = new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(
					() => reject(new Error('Timed out reconnecting client')),
					EVENT_TIMEOUT_MS
				)
				first.once('connect', () => {
					clearTimeout(timeout)
					resolve()
				})
			})
			first.connect()
			await reconnected
			notStrictEqual(first.id, disconnectedId)
			const reconnectJoin = await join(first, firstSlug)
			strictEqual(reconnectJoin.status, 'success')
			if (reconnectJoin.status === 'success') {
				strictEqual(reconnectJoin.snapshot?.content, 'aBcdEF')
			}

			const switchLeave = waitForEvent<{ id: string }>(observer, 'cursor-leave')
			strictEqual((await join(first, secondSlug)).status, 'success')
			strictEqual((await switchLeave).id, first.id)
		})

		await t.test('the last disconnect flushes accepted live changes', async () => {
			const slug = await createPaste('disconnect-flush', 'before')
			const writer = await createClient()
			await join(writer, slug)

			strictEqual(
				(
					await emitAck(
						writer,
						'code-change',
						codeChange(0, 0, 6, 'after')
					)
				).status,
				'success'
			)
			writer.disconnect()

			await waitUntil(async () => {
				const [row] = await db
					.select({
						content: realTimePastesTable.content,
						revision: realTimePastesTable.revision
					})
					.from(realTimePastesTable)
					.where(eq(realTimePastesTable.slug, slug))
				return row?.content === 'after' && row.revision === 1
			})

			const reconnectingReader = await createClient()
			const acknowledgement = await join(reconnectingReader, slug)
			strictEqual(acknowledgement.status, 'success')
			if (acknowledgement.status === 'success') {
				strictEqual(acknowledgement.revision, 1)
				strictEqual(acknowledgement.snapshot?.content, 'after')
			}
		})

		await t.test('revision CAS has one winner, conflict snapshot and explicit resync', async () => {
			const slug = await createPaste('cas')
			const first = await createClient()
			const second = await createClient()
			const firstJoin = await join(first, slug)
			const secondJoin = await join(second, slug)
			strictEqual(firstJoin.status, 'success')
			strictEqual(secondJoin.status, 'success')
			if (firstJoin.status === 'success') strictEqual(firstJoin.revision, 0)

			const remoteCode = waitForEvent(second, 'code-change')
			strictEqual(
				(
					await emitAck(
						first,
						'code-change',
						codeChange(0, 0, 0, 'winner')
					)
				).status,
				'success'
			)
			await remoteCode

			const attempts = await Promise.all([
				emitAck(first, 'content-sync', {
					content: 'winner',
					baseRevision: 0
				}),
				emitAck(second, 'content-sync', {
					content: 'winner',
					baseRevision: 0
				})
			])
			strictEqual(
				attempts.filter(({ status }) => status === 'success').length,
				1
			)
			strictEqual(
				attempts.filter(({ status }) => status === 'revision_conflict')
					.length,
				1
			)
			const conflict = attempts.find(
				(acknowledgement) =>
					acknowledgement.status === 'revision_conflict'
			) as Extract<
				SocketAcknowledgement,
				{ status: 'revision_conflict' }
			>
			strictEqual(conflict.revision, 1)
			strictEqual(conflict.snapshot.content, 'winner')

			const [persistedWinner] = await db
				.select({
					content: realTimePastesTable.content,
					revision: realTimePastesTable.revision
				})
				.from(realTimePastesTable)
				.where(eq(realTimePastesTable.slug, slug))
			strictEqual(persistedWinner?.content, 'winner')
			strictEqual(persistedWinner?.revision, 1)

			strictEqual(
				(
					await emitAck(
						second,
						'code-change',
						codeChange(0, 0, 6, 'stale')
					)
				).status,
				'revision_conflict'
			)
			strictEqual(
				(
					await emitAck(
						second,
						'code-change',
						codeChange(1, 0, 6, 'resynced')
					)
				).status,
				'success'
			)
			const resyncSave = await emitAck(second, 'content-sync', {
				content: 'resynced',
				baseRevision: 1
			})
			strictEqual(resyncSave.status, 'success')
			if (resyncSave.status === 'success') {
				strictEqual(resyncSave.revision, 2)
			}

			const metadataSave = await emitAck(second, 'meta-sync', {
				title: 'Shared revision',
				syntaxName: 'Plaintext',
				baseRevision: 2
			})
			strictEqual(metadataSave.status, 'success')
			if (metadataSave.status === 'success') {
				strictEqual(metadataSave.revision, 3)
			}

			const [finalRow] = await db
				.select({
					content: realTimePastesTable.content,
					revision: realTimePastesTable.revision,
					title: realTimePastesTable.title
				})
				.from(realTimePastesTable)
				.where(eq(realTimePastesTable.slug, slug))
			deepStrictEqual(finalRow, {
				content: 'resynced',
				revision: 3,
				title: 'Shared revision'
			})
		})

		await t.test('per-socket rate limits return retry time and reset with socket cleanup', async () => {
			const joinSlug = await createPaste('limit-join')
			const joinLimited = await createClient()
			for (
				let index = 0;
				index < SOCKET_LIMITS.rate.joinRoom.max;
				index += 1
			) {
				strictEqual((await join(joinLimited, joinSlug)).status, 'success')
			}
			const blockedJoin = await join(joinLimited, joinSlug)
			strictEqual(blockedJoin.status, 'rate_limited')
			if (blockedJoin.status === 'rate_limited') {
				ok(blockedJoin.retryAfterMs > 0)
				ok(blockedJoin.retryAfterMs <= SOCKET_LIMITS.rate.joinRoom.windowMs)
			}
			joinLimited.disconnect()
			const freshSocket = await createClient()
			strictEqual((await join(freshSocket, joinSlug)).status, 'success')

			const codeSlug = await createPaste('limit-code')
			const codeLimited = await createClient()
			await join(codeLimited, codeSlug)
			for (
				let index = 0;
				index < SOCKET_LIMITS.rate.codeChange.max;
				index += 1
			) {
				strictEqual(
					(
						await emitAck(
							codeLimited,
							'code-change',
							codeChange(0, 0, 0, '')
						)
					).status,
					'success'
				)
			}
			strictEqual(
				(
					await emitAck(
						codeLimited,
						'code-change',
						codeChange(0, 0, 0, '')
					)
				).status,
				'rate_limited'
			)

			const contentSlug = await createPaste('limit-content')
			const contentLimited = await createClient()
			await join(contentLimited, contentSlug)
			let contentRevision = 0
			for (
				let index = 0;
				index < SOCKET_LIMITS.rate.contentSync.max;
				index += 1
			) {
				const acknowledgement = await emitAck(
					contentLimited,
					'content-sync',
					{ content: '', baseRevision: contentRevision }
				)
				strictEqual(acknowledgement.status, 'success')
				if (acknowledgement.status === 'success') {
					contentRevision = acknowledgement.revision ?? contentRevision
				}
			}
			strictEqual(
				(
					await emitAck(contentLimited, 'content-sync', {
						content: '',
						baseRevision: contentRevision
					})
				).status,
				'rate_limited'
			)

			const metaSlug = await createPaste('limit-meta')
			const metaLimited = await createClient()
			await join(metaLimited, metaSlug)
			let metaRevision = 0
			for (
				let index = 0;
				index < SOCKET_LIMITS.rate.metaSync.max;
				index += 1
			) {
				const acknowledgement = await emitAck(metaLimited, 'meta-sync', {
					title: metaSlug,
					syntaxName: 'Plaintext',
					baseRevision: metaRevision
				})
				strictEqual(acknowledgement.status, 'success')
				if (acknowledgement.status === 'success') {
					metaRevision = acknowledgement.revision ?? metaRevision
				}
			}
			strictEqual(
				(
					await emitAck(metaLimited, 'meta-sync', {
						title: metaSlug,
						syntaxName: 'Plaintext',
						baseRevision: metaRevision
					})
				).status,
				'rate_limited'
			)

			const cursorSlug = await createPaste('limit-cursor')
			const cursorLimited = await createClient()
			await join(cursorLimited, cursorSlug)
			for (
				let index = 0;
				index < SOCKET_LIMITS.rate.cursorMove.max;
				index += 1
			) {
				strictEqual(
					(
						await emitAck(
							cursorLimited,
							'cursor-move',
							cursorPayload()
						)
					).status,
					'success'
				)
			}
			const blockedCursor = await emitAck(
				cursorLimited,
				'cursor-move',
				cursorPayload()
			)
			strictEqual(blockedCursor.status, 'rate_limited')
			if (blockedCursor.status === 'rate_limited') {
				ok(blockedCursor.retryAfterMs > 0)
			}
		})
	} finally {
		for (const socket of sockets) socket.disconnect()
		await closeWebSockets()
		if (server.listening) {
			await new Promise<void>((resolve) => server.close(() => resolve()))
		}
		if (slugs.size > 0) {
			await db
				.delete(realTimePastesTable)
				.where(inArray(realTimePastesTable.slug, [...slugs]))
		}
	}
})
