import { SOCKET_LIMITS, type SocketRateLimitEvent } from './socket-contract.js'

interface RateBucket {
	tokens: number
	updatedAt: number
}

export interface SocketRateLimitResult {
	allowed: boolean
	retryAfterMs: number
}

export class SocketRateLimiter {
	readonly #buckets = new Map<SocketRateLimitEvent, RateBucket>()

	consume(
		event: SocketRateLimitEvent,
		now = Date.now()
	): SocketRateLimitResult {
		this.cleanup(now)

		const limit = SOCKET_LIMITS.rate[event]
		const existing = this.#buckets.get(event)
		if (!existing) {
			this.#buckets.set(event, {
				tokens: limit.burst - 1,
				updatedAt: now
			})
			return { allowed: true, retryAfterMs: 0 }
		}

		const refillPerMillisecond = limit.max / limit.windowMs
		const elapsed = Math.max(0, now - existing.updatedAt)
		existing.tokens = Math.min(
			limit.burst,
			existing.tokens + elapsed * refillPerMillisecond
		)
		existing.updatedAt = Math.max(existing.updatedAt, now)

		if (existing.tokens < 1) {
			return {
				allowed: false,
				retryAfterMs: Math.max(
					1,
					Math.ceil((1 - existing.tokens) / refillPerMillisecond)
				)
			}
		}

		existing.tokens -= 1
		return { allowed: true, retryAfterMs: 0 }
	}

	cleanup(now = Date.now()): void {
		for (const [event, bucket] of this.#buckets) {
			if (now - bucket.updatedAt >= SOCKET_LIMITS.rate[event].windowMs) {
				this.#buckets.delete(event)
			}
		}
	}

	clear(): void {
		this.#buckets.clear()
	}

	get size(): number {
		return this.#buckets.size
	}
}
