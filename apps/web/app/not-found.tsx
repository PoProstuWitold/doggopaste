import type { Metadata } from 'next'
import { NotFoundClient } from './components/core/NotFoundClient'

export const metadata: Metadata = {
	title: '404 Not Found',
	description: 'Page not found'
}

export default function NotFound() {
	return <NotFoundClient />
}
