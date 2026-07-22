import type { Paste } from '../../types'
import { PasteForm } from './PasteForm/PasteForm'

export default function ForkPasteForm({
	paste,
	type,
	isAuthenticated
}: {
	paste: Paste
	type?: 'realtime' | 'static'
	isAuthenticated: boolean
}) {
	return (
		<PasteForm
			mode='fork'
			paste={paste}
			type={type}
			isAuthenticated={isAuthenticated}
		/>
	)
}
