import { adminClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_HONO_API_URL,
	plugins: [adminClient(), organizationClient()],
	fetchOptions: {
		credentials: 'include'
	}
})
