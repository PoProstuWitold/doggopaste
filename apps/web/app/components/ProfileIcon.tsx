import { createDynamicAuthClient } from '@/app/utils/auth-client'
import { headers } from 'next/headers'
import { ProfileIconClient } from './ProfileIconClient'

export const ProfileIcon = async () => {
	const authClient = createDynamicAuthClient()
	const session = await authClient.getSession({
		fetchOptions: {
			headers: await headers()
		}
	})

	const user = session.data?.user

	return <ProfileIconClient user={user} />
}

export default ProfileIcon
