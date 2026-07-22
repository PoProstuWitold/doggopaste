import { SOCKET_LIMITS, type SocketRateLimitEvent } from './socket-contract.js'

interface RateWindow {
	count: number
	resetAt: number
}

export interface SocketRateLimitResult {
	allowed: boolean
	retryAfterMs: number
}

export class SocketRateLimiter {
	readonly #windows = new Map<SocketRateLimitEvent, RateWindow>()

	consume(
		event: SocketRateLimitEvent,
		now = Date.now()
	): SocketRateLimitResult {
		this.cleanup(now)

		const limit = SOCKET_LIMITS.rate[event]
		const existing = this.#windows.get(event)
		if (!existing) {
			this.#windows.set(event, {
				count: 1,
				resetAt: now + limit.windowMs
			})
			return { allowed: true, retryAfterMs: 0 }
		}

		if (existing.count >= limit.max) {
			return {
				allowed: false,
				retryAfterMs: Math.max(1, existing.resetAt - now)
			}
		}

		existing.count += 1
		return { allowed: true, retryAfterMs: 0 }
	}

	cleanup(now = Date.now()): void {
		for (const [event, window] of this.#windows) {
			if (window.resetAt <= now) this.#windows.delete(event)
		}
	}

	clear(): void {
		this.#windows.clear()
	}

	get size(): number {
		return this.#windows.size
	}
}
