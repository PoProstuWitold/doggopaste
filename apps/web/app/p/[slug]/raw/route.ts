import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getBaseApiUrl } from '@/app/utils/functions'

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ slug: string }> }
) {
	if (new URL(request.url).searchParams.has('password')) {
		return new NextResponse('Password query is not supported', {
			status: 400
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
			status: 404
		})
	}

	const json = await res.json()
	const paste = json.data

	if (paste.passwordProtected && !paste.content) {
		return new NextResponse('Password required to view this raw paste', {
			status: 401
		})
	}

	if (!paste.content && !paste.passwordProtected) {
		return new NextResponse('No content', { status: 404 })
	}

	return new NextResponse(paste.content, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'no-store'
		}
	})
}
