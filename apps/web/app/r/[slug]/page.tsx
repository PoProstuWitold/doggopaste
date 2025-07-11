import type { Metadata } from 'next'
import { RealtimeEditor } from '@/app/components/RealtimeEditor'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params

	return {
		title: `Realtime Editor "${slug}"`,
		description: `Realtime editor with slug "${slug}"`,
		metadataBase: new URL(
			process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
		)
	}
}

interface Props {
	params: Promise<{ slug: string }>
}

export default async function SinglePastePage({
	params
}: {
	params: Props['params']
}) {
	const { slug } = await params

	return <RealtimeEditor slug={slug} />
}
