import EditPasteForm from '@/app/components/EditPasteForm'
import type { PasteResponse } from '@/app/types'
import type { Metadata } from 'next'

async function fetchResponse(slug: string): Promise<PasteResponse> {
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_HONO_API_URL}/api/pastes/${slug}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		}
	)
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
	const { slug } = await params
	const { data, success } = await fetchResponse(slug)

	if (!success) {
		return <div>Paste not found</div>
	}

	return (
		<>
			<EditPasteForm slug={slug} paste={data} />
		</>
	)
}
