import CreatePasteForm from '@/app/components/CreatePasteForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Create Paste',
	description: 'Create a new paste on DoggoPaste'
}

export default function CreatePastePage() {
	return (
		<>
			<CreatePasteForm />
		</>
	)
}
