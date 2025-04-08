import { RealtimeEditor } from '@/app/components/RealtimeEditor'

export default async function SinglePastePage({
	params
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params

	return (
		<>
			<RealtimeEditor slug={slug} />
		</>
	)
}
