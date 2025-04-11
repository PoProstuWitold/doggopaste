import SinglePaste from '@/app/components/SinglePaste'
import type { PasteResponse } from '@/app/types'
import { getBaseApiUrl } from '@/app/utils/functions'
import type { Metadata } from 'next'

async function fetchResponse(slug: string): Promise<PasteResponse> {
	const res = await fetch(`${getBaseApiUrl()}/api/pastes/${slug}`)
	const json = await res.json()
	return json
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params

	return {
		title: `Paste "${slug}"`,
		description: `Paste with slug "${slug}"`,
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
	const { data, success } = await fetchResponse(slug)

	if (!success) {
		return <div>Paste not found</div>
	}

	return (
		<>
			<SinglePaste slug={slug} paste={data} />
		</>
	)
}
