import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getBaseApiUrl } from '@/app/utils/functions'

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ slug: string }> }
) {
	const { slug } = await params

	const { searchParams } = new URL(request.url)
	const password = searchParams.get('password')

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

	if (paste.passwordHash && !paste.content) {
		if (!password) {
			return new NextResponse(
				'Password required to view this raw paste',
				{
					status: 401
				}
			)
		}

		const verifyRes = await fetch(
			`${getBaseApiUrl()}/api/pastes/${slug}/verify`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					cookie: cookieHeader.toString()
				},
				body: JSON.stringify({ password })
			}
		)

		if (!verifyRes.ok) {
			return new NextResponse('Invalid password', { status: 403 })
		}

		const verifyJson = await verifyRes.json()

		return new NextResponse(verifyJson.content, {
			status: 200,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'no-store'
			}
		})
	}

	if (!paste.content && !paste.passwordHash) {
		return new NextResponse('No content', { status: 404 })
	}

	return new NextResponse(paste.content, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=60'
		}
	})
}
