import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { getBaseApiUrl } from './app/utils/functions'

export async function proxy(req: NextRequest) {
	const path = req.nextUrl.pathname

	if (
		path.startsWith('/_next') ||
		path.startsWith('/favicon.ico') ||
		path.match(/\.(png|jpg|jpeg|gif|svg|css|js|woff2?|ttf)$/)
	) {
		return NextResponse.next()
	}

	console.info('[middleware] Triggered:', path)

	// Only for not logged in users
	const publicOnlyPaths = ['/login']

	// Only for logged in users
	const protectedPaths: (string | RegExp)[] = [
		'/profile',
		/^\/p\/[a-zA-Z0-9-]+\/edit$/
	]

	const isProtected = protectedPaths.some((route) =>
		route instanceof RegExp ? route.test(path) : route === path
	)

	let isLoggedIn = false

	// Try to get user info from the API
	const me = await fetch(`${getBaseApiUrl()}/api/auth/get-session`, {
		headers: await headers()
	})
	if (me.ok) {
		const text = await me.text()
		if (text) {
			try {
				const data = JSON.parse(text)
				if (data?.user) {
					isLoggedIn = true
				}
			} catch (err) {
				console.warn('Invalid JSON: ', err)
			}
		}
	}

	// Now we can redirect the user if needed
	if (isLoggedIn && publicOnlyPaths.includes(path)) {
		console.info(
			'[middleware] Redirecting logged-in user from public-only path:',
			path
		)
		return NextResponse.redirect(new URL('/', req.url))
	}

	if (!isLoggedIn && isProtected) {
		console.info(
			'[middleware] Redirecting anon user from protected path:',
			path
		)
		return NextResponse.redirect(new URL('/login', req.url))
	}

	return NextResponse.next()
}
