import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import ForkPasteForm from '@/app/components/custom/ForkPasteForm'
import type { PasteResponse } from '@/app/types'
import { getBaseApiUrl } from '@/app/utils/functions'

async function fetchResponse(slug: string): Promise<PasteResponse> {
	const cookieHeader = await cookies()
	const res = await fetch(`${getBaseApiUrl()}/api/pastes/${slug}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			cookie: cookieHeader.toString()
		}
	})
	const json = await res.json()
	return json
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params

	return {
		title: `Fork Static Paste "${slug}"`,
		description: `Fork static paste "${slug}"`,
		metadataBase: new URL(process.env.APP_URL || 'https://doggopaste.org')
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
	const { slug } = await params
	const { data, success } = await fetchResponse(slug)

	if (!success) {
		return <div>Paste doesn't exist or it's private</div>
	}

	return <ForkPasteForm paste={data} />
}
