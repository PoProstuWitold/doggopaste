import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getBaseApiUrl } from '@/app/utils/functions'

export async function GET(
	_: Request,
	{ params }: { params: Promise<{ slug: string }> }
) {
	const { slug } = await params
	const cookieHeader = await cookies()
	const res = await fetch(`${getBaseApiUrl()}/api/pastes/${slug}`, {
		credentials: 'include',
		headers: {
			cookie: cookieHeader.toString()
		}
	})

	if (!res.ok) {
		return new NextResponse(`Paste doesn't exist or it's private`, {
			status: 404
		})
	}

	const json = await res.json()

	if (!json?.data?.content) {
		return new NextResponse('No content', { status: 404 })
	}

	return new NextResponse(json.data.content, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=60'
		}
	})
}
