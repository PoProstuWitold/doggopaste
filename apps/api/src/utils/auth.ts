import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, openAPI, organization } from 'better-auth/plugins'

import { db } from '../db/index.js'
import { schema } from '../db/schema.js'
import { origins } from './contants.js'

export const auth = betterAuth({
	appName: process.env.APP_NAME,
	baseURL: process.env.APP_URL,
	basePath: '/api/auth',
	secret: process.env.BETTER_AUTH_SECRET,
	trustedOrigins: origins,
	ipAddress: {
		ipAddressHeaders: ['x-client-ip', 'x-forwarded-for'],
		disableIpTracking: false
	},
	plugins: [
		openAPI({
			path: '/docs'
		}),
		admin(),
		organization()
	],
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			...schema
		},
		usePlural: true
	}),
	advanced: {
		database: {
			generateId: false
		},
		cookiePrefix: 'doggopaste',
		defaultCookieAttributes: {
			secure: false,
			httpOnly: true,
			sameSite: 'Lax', // Allows CORS-based cookie sharing across subdomains
			partitioned: true // New browser standards will mandate this for foreign cookies
		},
		...(process.env.COOKIE_DOMAIN
			? {
					crossSubDomainCookies: {
						enabled: true,
						domain: process.env.COOKIE_DOMAIN // e.g., ".example.com"
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
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string
		}
	}
})
