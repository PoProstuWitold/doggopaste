import type { Metadata } from 'next'
import CreatePasteForm from '@/app/components/custom/CreatePasteForm'

export const metadata: Metadata = {
	title: 'Create Static Paste',
	description: 'Create a new static paste on DoggoPaste'
}

export default function CreatePastePage() {
	return <CreatePasteForm />
}
