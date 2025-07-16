import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { RealtimeEditor } from '@/app/components/RealtimeEditor'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { getBaseApiUrl } from '@/app/utils/functions'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params

	return {
		title: `Realtime Editor "${slug}"`,
		description: `Realtime editor with slug "${slug}"`,
		metadataBase: new URL(
			process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
		)
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

	const res = await fetch(`${getBaseApiUrl()}/api/pastes-realtime/${slug}`, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			token: tokenResponse.data?.token ?? null
		})
	})

	const json = await res.json()
	console.log('realtime paste', json)
	console.log('slug', slug)

	return (
		<RealtimeEditor
			slug={slug}
			realtimePaste={json.realtimePaste}
			session={json.session}
		/>
	)
}
