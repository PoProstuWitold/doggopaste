import { NextResponse } from 'next/server'
import { getBaseApiUrl } from '@/app/utils/functions'

const noStoreHeaders = {
	'Cache-Control': 'no-store'
}

export async function GET(
	_: Request,
	{ params }: { params: Promise<{ slug: string }> }
) {
	const { slug } = await params

	let res: Response
	try {
		res = await fetch(`${getBaseApiUrl()}/api/pastes-realtime/${slug}`, {
			credentials: 'include',
			cache: 'no-store'
		})
	} catch {
		return new NextResponse('Upstream request failed', {
			status: 502,
			headers: noStoreHeaders
		})
	}

	if (res.status === 404) {
		return new NextResponse('Not found', {
			status: 404,
			headers: noStoreHeaders
		})
	}

	if (!res.ok) {
		return new NextResponse('Upstream request failed', {
			status: res.status,
			headers: noStoreHeaders
		})
	}

	const json = await res.json().catch(() => null)

	if (!json?.data || typeof json.data.content !== 'string') {
		return new NextResponse('Invalid upstream response', {
			status: 502,
			headers: noStoreHeaders
		})
	}

	return new NextResponse(json.data.content, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			...noStoreHeaders
		}
	})
}
