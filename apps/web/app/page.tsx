import { headers } from 'next/headers'
import { CustomDialog } from './components/CustomDialog'
import { authClient } from './utils/auth-client'

export default async function HomePage() {
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
