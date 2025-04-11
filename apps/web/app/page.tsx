import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { createDynamicAuthClient } from './utils/auth-client'

export const metadata: Metadata = {
	title: 'DoggoPaste',
	description:
		'Drop your code, let Doggo fetch it! Combination of a Pastebin and CodeShare. Free and selfhostable.'
}

export default async function HomePage() {
	const authClient = createDynamicAuthClient()
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers()
		}
	})

	return (
		<>
			{session.data?.user ? (
				<h1>Welcome {session.data.user.name}</h1>
			) : (
				<h1>Not logged in</h1>
			)}
		</>
	)
}
