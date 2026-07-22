import type { Metadata } from 'next'
import EditPasteForm from '@/app/components/custom/EditPasteForm'
import { getStaticPaste } from '@/app/utils/api-data'
import { getCurrentViewer } from '@/app/utils/session'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params

	return {
		title: `Edit Static Paste "${slug}"`,
		description: `Edit static paste "${slug}"`,
		metadataBase: new URL(process.env.APP_URL || 'https://doggopaste.org')
	}
}

interface Props {
	params: Promise<{ slug: string }>
}

export default async function EditPastePage({
	params
}: {
	params: Promise<{ slug: string }>
}) {
	const viewer = await getCurrentViewer()

	const { slug } = await params
	const result = await getStaticPaste(slug)
	const { data, success } = result.data ?? { data: null, success: false }

	if (!success || !data) {
		return <div>Paste doesn't exist or it's private</div>
	}

	if (data.userId !== viewer?.id) {
		return <div>You are not owner of this paste</div>
	}

	return (
		<EditPasteForm
			slug={slug}
			paste={data}
			isAuthenticated={viewer !== null}
		/>
	)
}
