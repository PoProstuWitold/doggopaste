import EditPasteForm from '@/app/components/EditPasteForm'

export default async function EditPastePage({
	params
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params

	return (
		<>
			<EditPasteForm slug={slug} />
		</>
	)
}
