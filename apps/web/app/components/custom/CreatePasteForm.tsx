import { PasteForm } from './PasteForm/PasteForm'

export default function CreatePasteForm({
	isAuthenticated
}: {
	isAuthenticated: boolean
}) {
	return <PasteForm mode='create' isAuthenticated={isAuthenticated} />
}
