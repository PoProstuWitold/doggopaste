import { adminClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
	baseURL: 'http://localhost:3001',
	plugins: [adminClient(), organizationClient()],
	fetchOptions: {
		credentials: 'include'
	}
})
