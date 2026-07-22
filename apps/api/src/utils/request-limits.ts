export const REQUEST_LIMITS = {
	jsonBodyBytes: 2 * 1024 * 1024,
	paste: {
		title: 100,
		createSlug: 40,
		routeSlug: 64,
		description: 255,
		content: 1_000_000,
		password: 128,
		tags: 20,
		tag: 16,
		syntax: 64
	}
} as const

export const REST_RATE_LIMITS = {
	passwordHash: {
		scope: 'paste-password-hash',
		max: 5,
		windowMs: 60_000
	},
	passwordVerify: {
		scope: 'paste-password-verify',
		max: 5,
		windowMs: 60_000
	},
	store: {
		maxEntries: 10_000,
		cleanupIntervalMs: 60_000
	}
} as const
