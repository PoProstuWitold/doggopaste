import SinglePaste from '@/app/components/SinglePaste'

async function fetchData(slug: string) {
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_HONO_API_URL}/api/pastes/${slug}`
	)
	const data = await res.json()
	return data
}

export default async function SinglePastePage({
	params
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const { data } = await fetchData(slug)

	return (
		<>
			<SinglePaste
				slug={slug}
				content={data.content}
				syntax={data.syntax}
			/>
		</>
	)
}
