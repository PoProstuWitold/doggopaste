import { strictEqual } from 'node:assert'
import test from 'node:test'
import { SOCKET_LIMITS } from '../../src/utils/socket-contract.js'
import { SocketRateLimiter } from '../../src/utils/socket-rate-limiter.js'

test('socket limiter isolates event quotas and resets expired windows', () => {
	const limiter = new SocketRateLimiter()
	const now = 1_000

	for (
		let index = 0;
		index < SOCKET_LIMITS.rate.joinRoom.burst;
		index += 1
	) {
		strictEqual(limiter.consume('joinRoom', now).allowed, true)
	}
	const blocked = limiter.consume('joinRoom', now)
	strictEqual(blocked.allowed, false)
	strictEqual(
		blocked.retryAfterMs,
		SOCKET_LIMITS.rate.joinRoom.windowMs /
			SOCKET_LIMITS.rate.joinRoom.max
	)
	strictEqual(limiter.consume('contentSync', now).allowed, true)

	strictEqual(
		limiter.consume(
			'joinRoom',
			now + blocked.retryAfterMs
		).allowed,
		true
	)
})

test('socket limiter permits a normal sustained realtime burst', () => {
	const limiter = new SocketRateLimiter()
	const events = [
		'codeChange',
		'cursorMove',
		'presenceUpdate',
		'titleChange'
	] as const

	for (const event of events) {
		for (let second = 0; second < 12; second += 1) {
			for (let index = 0; index < 30; index += 1) {
				strictEqual(
					limiter.consume(event, second * 1_000).allowed,
					true
				)
			}
		}
	}
})

test('socket limiter has one bounded bucket per event and clears on disconnect', () => {
	const limiter = new SocketRateLimiter()
	limiter.consume('joinRoom')
	limiter.consume('codeChange')
	limiter.consume('contentSync')
	limiter.consume('metaSync')
	limiter.consume('cursorMove')
	limiter.consume('presenceUpdate')
	limiter.consume('titleChange')

	strictEqual(limiter.size, Object.keys(SOCKET_LIMITS.rate).length)
	limiter.clear()
	strictEqual(limiter.size, 0)
})
