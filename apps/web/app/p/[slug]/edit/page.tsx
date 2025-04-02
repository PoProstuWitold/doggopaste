import EditPasteForm from '@/app/components/EditPasteForm'
import type { PasteResponse } from '@/app/types'

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
