import { deepStrictEqual, strictEqual } from 'node:assert'
import test from 'node:test'
import { REQUEST_LIMITS } from '../../src/utils/request-limits.js'
import {
	applyRealtimeCodeChanges,
	codeChangePayloadSchema,
	contentSyncPayloadSchema,
	cursorMovePayloadSchema,
	joinRoomPayloadSchema,
	metaSyncPayloadSchema,
	SOCKET_LIMITS
} from '../../src/utils/socket-contract.js'

test('code-change batches use CodeMirror base-document coordinates', () => {
	strictEqual(
		applyRealtimeCodeChanges('abcdef', [
			{ from: 1, to: 2, insert: 'B' },
			{ from: 4, to: 6, insert: 'EF' }
		]),
		'aBcdEF'
	)
	strictEqual(
		applyRealtimeCodeChanges('abcdef', [
			{ from: 3, to: 4, insert: 'D' },
			{ from: 1, to: 2, insert: 'B' }
		]),
		null
	)
	strictEqual(
		applyRealtimeCodeChanges('abcdef', [
			{ from: 1, to: 4, insert: '' },
			{ from: 3, to: 5, insert: '' }
		]),
		null
	)
})

test('socket schemas validate and normalize the public event contract', () => {
	deepStrictEqual(joinRoomPayloadSchema.parse('public-room'), {
		slug: 'public-room'
	})
	deepStrictEqual(joinRoomPayloadSchema.parse({ slug: 'public-room' }), {
		slug: 'public-room'
	})
	strictEqual(joinRoomPayloadSchema.safeParse('invalid_room').success, false)

	const codeChange = codeChangePayloadSchema.parse({
		from: 0,
		to: 0,
		insert: 'a',
		baseRevision: 2,
		sender: 'spoofed',
		slug: 'public-room'
	})
	deepStrictEqual(codeChange, {
		changes: [{ from: 0, to: 0, insert: 'a' }],
		baseRevision: 2,
		slug: 'public-room'
	})
	deepStrictEqual(
		codeChangePayloadSchema.parse({
			changes: [
				{ from: 0, to: 1, insert: 'a' },
				{ from: 3, to: 4, insert: 'b' }
			],
			baseRevision: 3
		}),
		{
			changes: [
				{ from: 0, to: 1, insert: 'a' },
				{ from: 3, to: 4, insert: 'b' }
			],
			baseRevision: 3
		}
	)
	strictEqual(
		codeChangePayloadSchema.safeParse({
			changes: [{ from: 0, to: 0, insert: 'a' }]
		}).success,
		false
	)

	strictEqual(
		contentSyncPayloadSchema.safeParse({
			content: 'x'.repeat(REQUEST_LIMITS.paste.content + 1),
			baseRevision: 0
		}).success,
		false
	)
	strictEqual(
		metaSyncPayloadSchema.safeParse({
			title: 'Title',
			syntaxName: 'Plaintext',
			baseRevision: -1
		}).success,
		false
	)
})

test('cursor schema rejects invalid coordinates, positions and selections', () => {
	const validCursor = {
		x: 10,
		y: 20,
		name: 'Guest',
		viewportWidth: 1280,
		viewportHeight: 720,
		position: 2,
		selection: { anchor: 1, head: 2 }
	}
	strictEqual(cursorMovePayloadSchema.safeParse(validCursor).success, true)
	strictEqual(
		cursorMovePayloadSchema.safeParse({ ...validCursor, position: -1 })
			.success,
		false
	)
	strictEqual(
		cursorMovePayloadSchema.safeParse({
			...validCursor,
			selection: { anchor: 0.5, head: 2 }
		}).success,
		false
	)
	strictEqual(
		cursorMovePayloadSchema.safeParse({
			...validCursor,
			viewportWidth: SOCKET_LIMITS.viewport + 1
		}).success,
		false
	)
})
