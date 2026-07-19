import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getBaseApiUrl } from '@/app/utils/functions'

const noStoreHeaders = {
	'Cache-Control': 'no-store'
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ slug: string }> }
) {
	if (new URL(request.url).searchParams.has('password')) {
		return new NextResponse('Password query is not supported', {
			status: 400,
			headers: noStoreHeaders
		})
	}

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
			status: 404,
			headers: noStoreHeaders
		})
	}

	const json = await res.json()
	const paste = json.data

	if (paste.passwordProtected && !paste.content) {
		return new NextResponse('Password required to view this raw paste', {
			status: 401,
			headers: noStoreHeaders
		})
	}

	if (!paste.content && !paste.passwordProtected) {
		return new NextResponse('No content', {
			status: 404,
			headers: noStoreHeaders
		})
	}

	return new NextResponse(paste.content, {
		status: 200,
		headers: {
			...noStoreHeaders,
			'Content-Type': 'text/plain; charset=utf-8'
		}
	})
}
