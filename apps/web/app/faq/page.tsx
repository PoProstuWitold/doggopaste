import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'FAQ',
	description: 'Frequently Asked Questions about DoggoPaste'
}

export default function FaqPage() {
	return <h1>FAQ</h1>
}
