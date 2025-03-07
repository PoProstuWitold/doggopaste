import type { Server as WebSocketsServer } from 'socket.io'

export type Env = {
	Variables: {
		io: WebSocketsServer
	}
}
