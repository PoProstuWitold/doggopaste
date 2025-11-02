import type { Paste } from '../../types'
import { PasteForm } from './PasteForm/PasteForm'

export default function ForkPasteForm({
	paste,
	type
}: {
	paste: Paste
	type?: 'realtime' | 'static'
}) {
	return <PasteForm mode='fork' paste={paste} type={type} />
}
