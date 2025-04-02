import type { Paste } from '../types'
import { PasteForm } from './PasteForm'

export default function EditPasteForm({
	slug,
	paste
}: { slug: string; paste: Paste }) {
	return <PasteForm mode='edit' slug={slug} paste={paste} />
}
