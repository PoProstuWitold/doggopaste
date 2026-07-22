import type { Metadata } from 'next'
import SinglePaste from '@/app/components/custom/SinglePaste'
import { getStaticPaste } from '@/app/utils/api-data'
import { getCurrentViewer } from '@/app/utils/session'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params

	return {
		title: `Static Paste "${slug}"`,
		description: `Static paste with slug "${slug}"`,
		metadataBase: new URL(process.env.APP_URL || 'https://doggopaste.org')
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
	const viewer = await getCurrentViewer()

	const { slug } = await params
	const result = await getStaticPaste(slug)
	const { data, success } = result.data ?? { data: null, success: false }

	if (!success || !data) {
		return <div>Paste doesn't exist or it's private</div>
	}

	return <SinglePaste slug={slug} paste={data} viewer={viewer} />
}
