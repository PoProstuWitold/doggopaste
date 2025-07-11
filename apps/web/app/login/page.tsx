import type { Metadata } from 'next'
import { Login } from '@/app/components/Login'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
	title: 'Login',
	description: 'Sing in to your account or create a new one'
}

export default function LoginPage() {
	return <Login />
}
