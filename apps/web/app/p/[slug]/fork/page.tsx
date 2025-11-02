import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import ForkPasteForm from '@/app/components/custom/ForkPasteForm'
import type { Paste, PasteResponse, RealtimePasteResponse } from '@/app/types'
import { getBaseApiUrl } from '@/app/utils/functions'

async function fetchStaticPaste(slug: string): Promise<PasteResponse> {
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

async function fetchRealtimePaste(
	slug: string
): Promise<RealtimePasteResponse> {
	const res = await fetch(`${getBaseApiUrl()}/api/pastes-realtime/${slug}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json'
		}
	})
	const json = await res.json()
	return json
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

	if (type === 'realtime') {
		const { data, success } = await fetchRealtimePaste(slug)

		if (!success) {
			return <div>Realtime Paste doesn't exist</div>
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
			organizationId: null,
			expiresAt: null,
			passwordHash: null,
			hits: 0,
			tags: []
		}
		return <ForkPasteForm paste={paste} type='realtime' />
	}

	const { data, success } = await fetchStaticPaste(slug)

	if (!success) {
		return <div>Paste doesn't exist or it's private</div>
	}

	return <ForkPasteForm paste={data} />
}
