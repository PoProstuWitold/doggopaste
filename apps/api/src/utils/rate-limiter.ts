import { getIp } from 'better-auth/api'
import type { Context } from 'hono'
import { GenericException } from '../exceptions/generic-exception.js'
import type { Env } from '../types.js'
import { auth } from './auth.js'
import { REST_RATE_LIMITS } from './request-limits.js'

interface RateLimitEntry {
	count: number
	resetAt: number
}

export interface RateLimitPolicy {
	scope: string
	max: number
	windowMs: number
}

export interface RateLimitDecision {
	allowed: boolean
	retryAfterSeconds: number
}

export class InMemoryFixedWindowRateLimiter {
	readonly #entries = new Map<string, RateLimitEntry>()
	#lastCleanupAt = 0

	constructor(
		private readonly maxEntries: number,
		private readonly cleanupIntervalMs: number
	) {
		if (maxEntries < 1 || cleanupIntervalMs < 1) {
			throw new RangeError('Rate limiter bounds must be positive')
		}
	}

	get size(): number {
		return this.#entries.size
	}

	consume(
		key: string,
		policy: Pick<RateLimitPolicy, 'max' | 'windowMs'>,
		now = Date.now()
	): RateLimitDecision {
		if (policy.max < 1 || policy.windowMs < 1) {
			throw new RangeError('Rate limit policy must be positive')
		}

		if (now - this.#lastCleanupAt >= this.cleanupIntervalMs) {
			this.pruneExpired(now)
		}

		let entry = this.#entries.get(key)
		if (entry && now >= entry.resetAt) {
			this.#entries.delete(key)
			entry = undefined
		}

		if (!entry) {
			this.makeRoom(now)
			entry = { count: 1, resetAt: now + policy.windowMs }
			this.#entries.set(key, entry)
			return {
				allowed: true,
				retryAfterSeconds: this.retryAfter(entry.resetAt, now)
			}
		}

		if (entry.count >= policy.max) {
			return {
				allowed: false,
				retryAfterSeconds: this.retryAfter(entry.resetAt, now)
			}
		}

		entry.count += 1
		return {
			allowed: true,
			retryAfterSeconds: this.retryAfter(entry.resetAt, now)
		}
	}

	pruneExpired(now = Date.now()): void {
		for (const [key, entry] of this.#entries) {
			if (now >= entry.resetAt) this.#entries.delete(key)
		}
		this.#lastCleanupAt = now
	}

	private makeRoom(now: number): void {
		if (this.#entries.size < this.maxEntries) return
		this.pruneExpired(now)

		while (this.#entries.size >= this.maxEntries) {
			const oldestKey = this.#entries.keys().next().value
			if (typeof oldestKey !== 'string') return
			this.#entries.delete(oldestKey)
		}
	}

	private retryAfter(resetAt: number, now: number): number {
		return Math.max(1, Math.ceil((resetAt - now) / 1000))
	}
}

const restRateLimiter = new InMemoryFixedWindowRateLimiter(
	REST_RATE_LIMITS.store.maxEntries,
	REST_RATE_LIMITS.store.cleanupIntervalMs
)

function rateLimitKey(c: Context<Env>, scope: string): string {
	const clientIp = getIp(c.req.raw, auth.options) ?? 'no-trusted-ip'
	const resource =
		scope === REST_RATE_LIMITS.passwordVerify.scope
			? c.req.param('slug') || 'all'
			: 'all'
	return `${scope}|${clientIp}|${resource}`
}

export function enforceRestRateLimit(
	c: Context<Env>,
	policy: RateLimitPolicy
): void {
	const decision = restRateLimiter.consume(
		rateLimitKey(c, policy.scope),
		policy
	)

	if (decision.allowed) return

	c.header('Retry-After', String(decision.retryAfterSeconds))
	throw new GenericException({
		statusCode: 429,
		name: 'Too Many Requests',
		message: 'Too many costly requests. Please try again later.'
	})
}
