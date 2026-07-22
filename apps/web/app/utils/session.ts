import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'
import type { ProfileUserDto, ViewerDto } from '@/app/types'
import { createDynamicAuthClient } from './auth-client'

export async function getAuthRequestHeaders(): Promise<Headers> {
	const incoming = await headers()
	const outgoing = new Headers()

	for (const name of ['cookie', 'authorization', 'origin']) {
		const value = incoming.get(name)
		if (value) outgoing.set(name, value)
	}

	return outgoing
}

export const getCurrentSession = cache(async () => {
	const authClient = createDynamicAuthClient()
	const result = await authClient.getSession({
		fetchOptions: {
			headers: await getAuthRequestHeaders()
		}
	})

	return result.data ?? null
})

export const getCurrentViewer = cache(async (): Promise<ViewerDto | null> => {
	const currentSession = await getCurrentSession()
	if (!currentSession) return null

	return {
		id: currentSession.user.id,
		name: currentSession.user.name,
		role:
			typeof currentSession.user.role === 'string'
				? currentSession.user.role
				: null
	}
})

export const getCurrentProfileUser = cache(
	async (): Promise<ProfileUserDto | null> => {
		const currentSession = await getCurrentSession()
		if (!currentSession) return null

		return {
			id: currentSession.user.id,
			name: currentSession.user.name,
			email: currentSession.user.email,
			emailVerified: currentSession.user.emailVerified,
			role:
				typeof currentSession.user.role === 'string'
					? currentSession.user.role
					: null,
			createdAt: currentSession.user.createdAt,
			updatedAt: currentSession.user.updatedAt
		}
	}
)
