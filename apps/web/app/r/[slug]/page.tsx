import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { RealtimeEditor } from '@/app/components/custom/RealtimeEditor'
import type { RealtimePasteCreateResponse } from '@/app/types'
import { apiRequest } from '@/app/utils/api'
import { createDynamicAuthClient } from '@/app/utils/auth-client'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params

	return {
		title: `Realtime Editor "${slug}"`,
		description: `Realtime editor with slug "${slug}"`,
		metadataBase: new URL(process.env.APP_URL || 'https://doggopaste.org')
	}
}

interface Props {
	params: Promise<{ slug: string }>
}

export default async function SinglePastePage({
	params
}: {
	params: Props['params']
}) {
	const { slug } = await params

	const authClient = createDynamicAuthClient()
	const tokenResponse = await authClient.oneTimeToken.generate({
		fetchOptions: {
			headers: await headers()
		}
	})

	const result = await apiRequest<RealtimePasteCreateResponse>(
		`/api/pastes-realtime/${slug}`,
		{
			method: 'POST',
			json: {
				token: tokenResponse.data?.token ?? null
			}
		}
	)

	if (result.status === 400 || result.status === 404) notFound()
	if (!result.ok) {
		throw new Error(`Failed to load realtime paste (${result.status})`)
	}

	const json = result.data
	if (!json?.realtimePaste || json.realtimePaste.slug !== slug) {
		throw new Error('Invalid realtime paste response')
	}

	return (
		<RealtimeEditor
			slug={slug}
			realtimePaste={json.realtimePaste}
			viewer={json.viewer}
		/>
	)
}
