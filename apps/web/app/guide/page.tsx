import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Guide',
	description: 'Learn how to use DoggoPaste'
}

export default function GuidePage() {
	return (
		<>
			<h1>Guide</h1>
		</>
	)
}
