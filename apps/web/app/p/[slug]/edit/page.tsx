import type { Metadata } from 'next'
import { headers } from 'next/headers'
import EditPasteForm from '@/app/components/EditPasteForm'
import type { PasteResponse } from '@/app/types'
import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { getBaseApiUrl } from '@/app/utils/functions'

async function fetchResponse(slug: string): Promise<PasteResponse> {
	const res = await fetch(`${getBaseApiUrl()}/api/pastes/${slug}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	})
	const json = await res.json()
	return json
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params

	return {
		title: `Edit Paste "${slug}"`,
		description: `Edit paste "${slug}"`,
		metadataBase: new URL(
			process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
		)
	}
}

interface Props {
	params: Promise<{ slug: string }>
}

export default async function EditPastePage({
	params
}: {
	params: Promise<{ slug: string }>
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

	if (data.userId !== user?.id) {
		return <div>You are not owner of this paste</div>
	}

	if (!success) {
		return <div>Paste not found</div>
	}

	return <EditPasteForm slug={slug} paste={data} />
}
