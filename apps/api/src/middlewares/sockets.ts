import type { ServerType } from '@hono/node-server'
import { createMiddleware } from 'hono/factory'
import { Server as WebSocketsServer } from 'socket.io'
import { origins } from '../utils/contants.js'

let io: WebSocketsServer | null

export function initWebSockets(server: ServerType) {
	io = new WebSocketsServer(server, {
		path: '/ws',
		cors: {
			origin: origins,
			credentials: true
		},
		connectionStateRecovery: {}
	})

	io.on('error', (err) => {
		console.error(err)
	})

	io.on('connection', (socket) => {
		console.info(`Socket ${socket.id} connected!`)
		socket.on('disconnect', (reason) => {
			console.info(`Socket ${socket.id} disconnected! Reason '${reason}'`)
		})

		socket.on('message', (msg, _callback) => {
			console.info(`Received message from socket ${socket.id}: "${msg}"`)
		})

		// PROJECT SPECIFIC EVENTS
		socket.on('join-room', (slug: string) => {
			console.info(`Socket ${socket.id} joined room ${slug}`)
			socket.join(slug)
		})

		socket.on('code-change', ({ from, to, insert, sender, slug }) => {
			// only for sockets in same room
			socket.to(slug).emit('code-change', {
				from,
				to,
				insert,
				sender
			})
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
