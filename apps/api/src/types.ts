import type { Server as WebSocketsServer } from 'socket.io'
import type { auth } from './utils/index.js'

export type Env = {
	Variables: {
		io: WebSocketsServer
		user: typeof auth.$Infer.Session.user | null
		session: typeof auth.$Infer.Session.session | null
	}
}

export interface Session {
	session: {
		id: string
		token: string
		userId: string
		ipAddress: string
		userAgent: string
		createdAt: string
		updatedAt: string
		expiresAt: string
		impersonatedBy: string | null
		activeOrganizationId: string | null
	}
	user: {
		id: string
		name: string
		email: string
		emailVerified: boolean
		image: string | null
		role: string
		createdAt: string
		updatedAt: string
		banned: boolean | null
		banReason: string | null
		banExpires: string | null
	}
}
