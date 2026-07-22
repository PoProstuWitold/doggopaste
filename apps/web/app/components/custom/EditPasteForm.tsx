import type { Paste } from '../../types'
import { PasteForm } from './PasteForm/PasteForm'

export default function EditPasteForm({
	slug,
	paste,
	isAuthenticated
}: {
	slug: string
	paste: Paste
	isAuthenticated: boolean
}) {
	return (
		<PasteForm
			mode='edit'
			slug={slug}
			paste={paste}
			isAuthenticated={isAuthenticated}
		/>
	)
}
