import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { openAPI } from 'better-auth/plugins'

import { db } from '../db/index.js'
import { schema } from '../db/schema.js'

export const auth = betterAuth({
	plugins: [
		openAPI({
			path: '/docs'
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
		crossSubDomainCookies: {
			enabled: true
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
	session: {
		modelName: 'sessions'
	},
	account: {
		modelName: 'accounts'
	},
	verification: {
		modelName: 'verifications'
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
