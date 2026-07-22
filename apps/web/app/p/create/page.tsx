import type { Metadata } from 'next'
import CreatePasteForm from '@/app/components/custom/CreatePasteForm'
import { getCurrentViewer } from '@/app/utils/session'

export const metadata: Metadata = {
	title: 'Create Static Paste',
	description: 'Create a new static paste on DoggoPaste'
}

export default async function CreatePastePage() {
	const viewer = await getCurrentViewer()
	return <CreatePasteForm isAuthenticated={viewer !== null} />
}
