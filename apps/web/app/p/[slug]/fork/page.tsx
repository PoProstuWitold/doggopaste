import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ForkPasteForm from '@/app/components/custom/ForkPasteForm'
import type { Paste, RealtimePasteResponse } from '@/app/types'
import { apiRequest } from '@/app/utils/api'
import { getStaticPaste } from '@/app/utils/api-data'
import { getCurrentViewer } from '@/app/utils/session'

async function fetchRealtimePaste(
	slug: string
): Promise<RealtimePasteResponse> {
	const result = await apiRequest<RealtimePasteResponse>(
		`/api/pastes-realtime/${encodeURIComponent(slug)}`
	)
	if (result.status === 404) notFound()
	if (!result.ok || !result.data) {
		throw new Error('Failed to fetch realtime paste')
	}
	return result.data
}

export async function generateMetadata({
	params,
	searchParams
}: Props): Promise<Metadata> {
	const { slug } = await params
	const { type } = await searchParams

	const isRealtime = type === 'realtime'
	return {
		title: isRealtime
			? `Fork Realtime Paste "${slug}"`
			: `Fork Static Paste "${slug}"`,
		description: isRealtime
			? `Fork realtime paste with slug "${slug}"`
			: `Fork static paste with slug "${slug}"`,
		metadataBase: new URL(process.env.APP_URL || 'https://doggopaste.org')
	}
}

interface Props {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ type?: string }>
}

export default async function EditPastePage({
	params,
	searchParams
}: {
	params: Promise<{ slug: string }>
	searchParams: Promise<{ type?: string }>
}) {
	const { slug } = await params
	const { type } = await searchParams
	const viewer = await getCurrentViewer()

	if (type === 'realtime') {
		const { data, success } = await fetchRealtimePaste(slug)

		if (!success) {
			throw new Error('Invalid realtime paste response')
		}

		const paste: Paste = {
			id: data.id,
			createdAt: data.createdAt,
			updatedAt: data.updatedAt,
			title: data.title,
			slug: data.slug,
			content: data.content,
			syntax: data.syntax,
			description: '',
			expiration: 'never',
			category: 'none',
			visibility: 'public',
			userId: null,
			folderId: null,
			expiresAt: null,
			passwordProtected: false,
			encrypted: false,
			hits: 0,
			tags: []
		}
		return (
			<ForkPasteForm
				paste={paste}
				type='realtime'
				isAuthenticated={viewer !== null}
			/>
		)
	}

	const staticResult = await getStaticPaste(slug)
	if (staticResult.status === 404) notFound()
	if (!staticResult.ok || !staticResult.data) {
		throw new Error('Failed to fetch static paste')
	}
	const { data, success } = staticResult.data

	if (!success) {
		throw new Error('Invalid static paste response')
	}

	return <ForkPasteForm paste={data} isAuthenticated={viewer !== null} />
}
