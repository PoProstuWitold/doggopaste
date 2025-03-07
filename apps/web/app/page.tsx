export default async function Home() {
	const res = await fetch('http://localhost:3001/api', {
		cache: 'no-store'
	})

	if (!res.ok) {
		throw new Error('Failed to fetch data')
	}

	const text = await res.text()

	return (
		<>
			<h1>DoggoPaste</h1>
			<p>API response: {text}</p>
		</>
	)
}
