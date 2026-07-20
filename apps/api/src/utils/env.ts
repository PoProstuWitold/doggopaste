import { z } from 'zod'

const optionalEnvironmentValue = z.preprocess(
	(value) =>
		typeof value === 'string' && value.trim() === '' ? undefined : value,
	z.string().min(1).optional()
)

const optionalCookieDomain = z.preprocess(
	(value) =>
		typeof value === 'string' && value.trim() === '' ? undefined : value,
	z
		.string()
		.max(253)
		.regex(
			/^\.?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))*$/i,
			'COOKIE_DOMAIN must be a valid domain name'
		)
		.optional()
)

const authEnvironmentSchema = z
	.object({
		NODE_ENV: z.enum(['development', 'test', 'production']),
		APP_NAME: z.string().optional(),
		APP_URL: z
			.url('APP_URL must be a valid URL')
			.refine(
				(value) =>
					URL.canParse(value) &&
					['http:', 'https:'].includes(new URL(value).protocol),
				'APP_URL must use HTTP or HTTPS'
			),
		BETTER_AUTH_SECRET: z
			.string()
			.min(32, 'BETTER_AUTH_SECRET must contain at least 32 characters'),
		COOKIE_DOMAIN: optionalCookieDomain,
		GITHUB_CLIENT_ID: optionalEnvironmentValue,
		GITHUB_CLIENT_SECRET: optionalEnvironmentValue
	})
	.superRefine((environment, context) => {
		const hasClientId = environment.GITHUB_CLIENT_ID !== undefined
		const hasClientSecret = environment.GITHUB_CLIENT_SECRET !== undefined

		if (hasClientId === hasClientSecret) return

		context.addIssue({
			code: 'custom',
			message:
				'GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be configured together',
			path: [hasClientId ? 'GITHUB_CLIENT_SECRET' : 'GITHUB_CLIENT_ID']
		})
	})

export function parseAuthEnvironment(
	source: Record<string, string | undefined>
) {
	const result = authEnvironmentSchema.safeParse(source)
	if (result.success) return result.data

	const invalidFields = [
		...new Set(
			result.error.issues
				.map((issue) => issue.path[0])
				.filter((field): field is PropertyKey => field !== undefined)
				.map(String)
		)
	]

	throw new Error(
		`Invalid authentication environment: ${invalidFields.join(', ')}`
	)
}
