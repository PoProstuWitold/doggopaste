import { adminClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { getBaseApiUrl } from './functions'

export const createDynamicAuthClient = () =>
	createAuthClient({
		baseURL: getBaseApiUrl(),
		plugins: [adminClient(), organizationClient()],
		fetchOptions: {
			credentials: 'include'
		}
	})
