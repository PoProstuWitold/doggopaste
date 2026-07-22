import 'server-only'

import { cookies } from 'next/headers'
import { cache } from 'react'
import type { ApiDataResponse, PasteResponse, PublicUserDto } from '@/app/types'
import { apiRequest } from './api'

export const getPublicUserByName = cache(
	async (name: string): Promise<PublicUserDto | null> => {
		const result = await apiRequest<ApiDataResponse<PublicUserDto>>(
			`/api/user/name/${encodeURIComponent(name)}`,
			{
				cache: 'no-store'
			}
		)

		if (result.status === 404) return null
		if (!result.ok || !result.data?.data) {
			throw new Error('Failed to load user')
		}

		return result.data.data
	}
)

export async function getStaticPaste(slug: string) {
	const cookieHeader = await cookies()
	return apiRequest<PasteResponse>(
		`/api/pastes/${encodeURIComponent(slug)}`,
		{
			headers: { cookie: cookieHeader.toString() }
		}
	)
}
