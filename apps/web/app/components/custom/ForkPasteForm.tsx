import type { Paste } from '../../types'
import { PasteForm } from './PasteForm'

export default function ForkPasteForm({ paste }: { paste: Paste }) {
	return <PasteForm mode='fork' paste={paste} />
}
