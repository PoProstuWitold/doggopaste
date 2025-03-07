import type { ServerType } from '@hono/node-server'
import { createMiddleware } from 'hono/factory'
import { Server as WebSocketsServer } from 'socket.io'

let io: WebSocketsServer | null

export function initWebSockets(server: ServerType) {
	io = new WebSocketsServer(server, {
		path: '/ws',
		cors: {
			origin: '*'
		},
		connectionStateRecovery: {}
	})

	io.on('error', (err) => {
		console.log(err)
	})

	io.on('connection', (socket) => {
		console.log(`Socket ${socket.id} connected!`)
		socket.on('disconnect', (reason) => {
			console.log(`Socket ${socket.id} disconnected! Reason '${reason}'`)
		})

		socket.on('message', (msg, _callback) => {
			console.log(`Received message from socket ${socket.id}: "${msg}"`)
		})
	})
}

export const wsMiddleware = createMiddleware<{
	Variables: {
		io: WebSocketsServer
	}
}>(async (c, next) => {
	if (!c.var.io && io) {
		c.set('io', io)
	}
	await next()
})
