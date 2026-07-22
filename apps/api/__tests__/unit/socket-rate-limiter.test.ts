import { strictEqual } from 'node:assert'
import test from 'node:test'
import { SOCKET_LIMITS } from '../../src/utils/socket-contract.js'
import { SocketRateLimiter } from '../../src/utils/socket-rate-limiter.js'

test('socket limiter isolates event quotas and resets expired windows', () => {
	const limiter = new SocketRateLimiter()
	const now = 1_000

	for (let index = 0; index < SOCKET_LIMITS.rate.joinRoom.max; index += 1) {
		strictEqual(limiter.consume('joinRoom', now).allowed, true)
	}
	const blocked = limiter.consume('joinRoom', now)
	strictEqual(blocked.allowed, false)
	strictEqual(blocked.retryAfterMs, SOCKET_LIMITS.rate.joinRoom.windowMs)
	strictEqual(limiter.consume('contentSync', now).allowed, true)

	strictEqual(
		limiter.consume(
			'joinRoom',
			now + SOCKET_LIMITS.rate.joinRoom.windowMs
		).allowed,
		true
	)
})

test('socket limiter has one bounded bucket per event and clears on disconnect', () => {
	const limiter = new SocketRateLimiter()
	limiter.consume('joinRoom')
	limiter.consume('codeChange')
	limiter.consume('contentSync')
	limiter.consume('metaSync')
	limiter.consume('cursorMove')

	strictEqual(limiter.size, Object.keys(SOCKET_LIMITS.rate).length)
	limiter.clear()
	strictEqual(limiter.size, 0)
})

