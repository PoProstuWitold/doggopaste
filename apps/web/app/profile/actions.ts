'use server'

import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { getAuthRequestHeaders } from '@/app/utils/session'

export async function revokeSessionById(
	sessionId: string
): Promise<{ status: boolean }> {
	if (!sessionId || sessionId.length > 128) return { status: false }

	try {
		const authHeaders = await getAuthRequestHeaders()
		const authClient = createDynamicAuthClient()
		const sessions = await authClient.listSessions({
			fetchOptions: { headers: authHeaders }
		})

		const session = sessions.data?.find(
			(candidate) => candidate.id === sessionId
		)
		if (!session) return { status: false }

		const result = await authClient.revokeSession({
			token: session.token,
			fetchOptions: { headers: authHeaders }
		})

		return { status: result.data?.status === true && !result.error }
	} catch {
		return { status: false }
	}
}
