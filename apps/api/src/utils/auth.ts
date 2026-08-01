import { type BetterAuthPlugin, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, oneTimeToken, openAPI, organization } from 'better-auth/plugins'

import { db } from '../db/index.js'
import { schema } from '../db/schema.js'
import { origins } from './contants.js'
import { parseAuthEnvironment } from './env.js'

const authEnvironment = parseAuthEnvironment(process.env)

const socialProviders =
	authEnvironment.GITHUB_CLIENT_ID && authEnvironment.GITHUB_CLIENT_SECRET
		? {
				github: {
					clientId: authEnvironment.GITHUB_CLIENT_ID,
					clientSecret: authEnvironment.GITHUB_CLIENT_SECRET
				}
			}
		: {}

export const auth = betterAuth({
	telemetry: {
		enabled: false
	},
	rateLimit: {
		customRules: {
			'/get-session': false
		}
	},
	appName: authEnvironment.APP_NAME,
	baseURL: authEnvironment.APP_URL,
	basePath: '/api/auth',
	secret: authEnvironment.BETTER_AUTH_SECRET,
	trustedOrigins: origins,
	plugins: [
		openAPI({
			path: '/docs'
		}),
		oneTimeToken({
			expiresIn: 60 // in minutes
		}),
		admin() as BetterAuthPlugin,
		organization()
	],
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			...schema
		},
		usePlural: true
	}),
	databaseHooks: {
		user: {
			create: {
				before: async (user) => {
					const userCount = await db.$count(schema.users)
					if (userCount === 0) {
						return { data: { ...user, role: 'admin' } }
					}
					return { data: user }
				}
			}
		}
	},
	advanced: {
		ipAddress: {
			disableIpTracking: false,
			ipAddressHeaders: [
				'cf-connecting-ip',
				'x-client-ip',
				'x-real-ip',
				'x-forwarded-for'
			]
		},
		database: {
			generateId: false
		},
		cookiePrefix: 'doggopaste',
		defaultCookieAttributes: {
			secure: authEnvironment.NODE_ENV === 'production',
			httpOnly: true,
			sameSite: 'Lax', // Allows CORS-based cookie sharing across subdomains
			partitioned: false // New browser standards will mandate this for foreign cookies
		},
		...(authEnvironment.COOKIE_DOMAIN
			? {
					crossSubDomainCookies: {
						enabled: true,
						domain: authEnvironment.COOKIE_DOMAIN // e.g., ".example.com"
					}
				}
			: {})
	},
	user: {
		modelName: 'user',
		additionalFields: {
			role: {
				type: 'string',
				required: true,
				defaultValue: 'user',
				input: false
			}
		}
	},
	emailAndPassword: {
		enabled: true,
		disableSignUp: false,
		autoSignIn: true,
		minPasswordLength: 8,
		maxPasswordLength: 128,
		resetPasswordTokenExpiresIn: 3600
	},
	socialProviders
})
