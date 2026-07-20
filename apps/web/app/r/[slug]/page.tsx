import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { RealtimeEditor } from '@/app/components/custom/RealtimeEditor'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { getBaseApiUrl } from '@/app/utils/functions'

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

	if (res.status === 400 || res.status === 404) notFound()
	if (!res.ok) {
		throw new Error(`Failed to load realtime paste (${res.status})`)
	}

	const json = await res.json().catch(() => null)
	if (!json?.realtimePaste || json.realtimePaste.slug !== slug) {
		throw new Error('Invalid realtime paste response')
	}

	return (
		<RealtimeEditor
			slug={slug}
			realtimePaste={json.realtimePaste}
			session={json.session}
		/>
	)
}
