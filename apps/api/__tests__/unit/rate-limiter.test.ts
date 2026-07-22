// biome-ignore-all lint: test files
import { strictEqual } from 'node:assert'
import test from 'node:test'
import { InMemoryFixedWindowRateLimiter } from '../../src/utils/rate-limiter.js'
import { REST_RATE_LIMITS } from '../../src/utils/request-limits.js'

const onePerMinute = { max: 1, windowMs: 60_000 }

test('fixed-window limiter returns a bounded Retry-After and resets at TTL', () => {
	const limiter = new InMemoryFixedWindowRateLimiter(10, 60_000)

	strictEqual(limiter.consume('client', onePerMinute, 0).allowed, true)

	const limited = limiter.consume('client', onePerMinute, 1)
	strictEqual(limited.allowed, false)
	strictEqual(limited.retryAfterSeconds, 60)

	const almostReset = limiter.consume('client', onePerMinute, 59_001)
	strictEqual(almostReset.allowed, false)
	strictEqual(almostReset.retryAfterSeconds, 1)

	strictEqual(limiter.consume('client', onePerMinute, 60_000).allowed, true)
})

test('limiter lazily removes expired entries', () => {
	const limiter = new InMemoryFixedWindowRateLimiter(10, 60_000)

	limiter.consume('first', onePerMinute, 0)
	limiter.consume('second', onePerMinute, 0)
	strictEqual(limiter.size, 2)

	limiter.consume('current', onePerMinute, 60_001)
	strictEqual(limiter.size, 1)
})

test('limiter store never exceeds the configured global bound', () => {
	const limiter = new InMemoryFixedWindowRateLimiter(
		REST_RATE_LIMITS.store.maxEntries,
		REST_RATE_LIMITS.store.cleanupIntervalMs
	)

	for (let index = 0; index <= REST_RATE_LIMITS.store.maxEntries; index += 1) {
		limiter.consume(`client-${index}`, onePerMinute, 0)
	}

	strictEqual(limiter.size, REST_RATE_LIMITS.store.maxEntries)
})
