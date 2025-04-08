import { NextResponse } from 'next/server'

export async function GET(
	_: Request,
	{ params }: { params: Promise<{ slug: string }> }
) {
	const { slug } = await params

	const res = await fetch(
		`${process.env.NEXT_PUBLIC_HONO_API_URL}/api/pastes/${slug}`,
		{ credentials: 'include' }
	)

	if (!res.ok) {
		return new NextResponse('Not found', { status: 404 })
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
