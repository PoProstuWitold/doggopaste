import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import SinglePaste from '@/app/components/custom/SinglePaste'
import type { PasteResponse } from '@/app/types'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { getBaseApiUrl } from '@/app/utils/functions'

async function fetchResponse(slug: string): Promise<PasteResponse> {
	const cookieHeader = await cookies()
	const res = await fetch(`${getBaseApiUrl()}/api/pastes/${slug}`, {
		headers: {
			cookie: cookieHeader.toString()
		}
	})
	const json = await res.json()
	return json
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params

	return {
		title: `Paste "${slug}"`,
		description: `Paste with slug "${slug}"`,
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
	const authClient = createDynamicAuthClient()
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers()
		}
	})
	const user = session.data?.user || null

	const { slug } = await params
	const { data, success } = await fetchResponse(slug)

	if (!success) {
		return <div>Paste doesn't exist or it's private</div>
	}

	return <SinglePaste slug={slug} paste={data} user={user} />
}
