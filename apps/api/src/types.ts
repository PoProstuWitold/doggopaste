import type { Server as WebSocketsServer } from 'socket.io'
import type { auth } from './utils/index.js'

export type Env = {
	Variables: {
		io: WebSocketsServer
		user: typeof auth.$Infer.Session.user | null
		session: typeof auth.$Infer.Session.session | null
	}
}
