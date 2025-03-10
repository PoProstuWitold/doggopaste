import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, openAPI, organization } from 'better-auth/plugins'

import { db } from '../db/index.js'
import { schema } from '../db/schema.js'

export const auth = betterAuth({
	trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL, process.env.HONO_API_URL],
	ipAddress: {
		ipAddressHeaders: ['x-client-ip', 'x-forwarded-for'],
		disableIpTracking: false
	},
	plugins: [
		openAPI({
			path: '/docs'
		}),
		admin(),
		organization({
			teams: {
				enabled: true
			}
		})
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
		},
		crossSubDomainCookies: {
			enabled: true,
			cookieDomain: process.env.COOKIE_DOMAIN,
			domain: process.env.COOKIE_DOMAIN
		}
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
		autoSignIn: true
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string
		}
	}
})
