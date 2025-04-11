import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, openAPI, organization } from 'better-auth/plugins'

import { db } from '../db/index.js'
import { schema } from '../db/schema.js'

export const auth = betterAuth({
	appName: process.env.APP_NAME,
	baseURL: process.env.HONO_API_URL,
	basePath: '/api/auth',
	secret: process.env.BETTER_AUTH_SECRET,
	trustedOrigins: [
		process.env.NEXT_WEB_URL,
		process.env.HONO_API_URL,
		'http://localhost:3000',
		'http://localhost:3001'
	],
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
		generateId: false,
		cookiePrefix: 'doggopaste',
		defaultCookieAttributes: {
			sameSite: 'none',
			secure: true,
			partitioned: true
		}
		// crossSubDomainCookies:
		// 	process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN.length > 0
		// 		? {
		// 				enabled: true,
		// 				cookieDomain: new URL(process.env.COOKIE_DOMAIN)
		// 					.hostname,
		// 				domain: new URL(process.env.COOKIE_DOMAIN).hostname
		// 			}
		// 		: undefined
	},
	user: {
		modelName: 'users',
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
