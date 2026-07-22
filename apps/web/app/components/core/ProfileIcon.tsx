import { getCurrentViewer } from '@/app/utils/session'
import { ProfileIconClient } from './ProfileIconClient'

export const ProfileIcon = async () => {
	const viewer = await getCurrentViewer()

	return <ProfileIconClient viewer={viewer} />
}
