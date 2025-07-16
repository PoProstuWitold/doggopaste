import type { ServerType } from '@hono/node-server'
import { eq } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'
import { Server as WebSocketsServer } from 'socket.io'
import { db } from '../db/index.js'
import { realTimePastesTable, syntaxesTable } from '../db/schema.js'
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

		// Sending code changes to all clients in the room
		socket.on('code-change', ({ from, to, insert, sender, slug }) => {
			// only for sockets in same room
			socket.to(slug).emit('code-change', {
				from,
				to,
				insert,
				sender
			})
		})

		// Syncing content with all clients in the room
		socket.on('content-sync', async ({ slug, content }) => {
			if (!slug || typeof content !== 'string') return

			try {
				await db
					.update(realTimePastesTable)
					.set({
						content,
						updatedAt: new Date()
					})
					.where(eq(realTimePastesTable.slug, slug))
			} catch (err) {
				console.error(`[WS] Failed to sync content for ${slug}:`, err)
			}
		})

		socket.on('meta-sync', async ({ slug, title, syntaxName }) => {
			if (!slug || !syntaxName) return

			try {
				const [syntax] = await db
					.select()
					.from(syntaxesTable)
					.where(eq(syntaxesTable.name, syntaxName))

				if (!syntax) {
					console.warn(`[WS] Syntax "${syntaxName}" not found`)
					return
				}

				await db
					.update(realTimePastesTable)
					.set({
						title: title || slug,
						syntaxId: syntax.id,
						updatedAt: new Date()
					})
					.where(eq(realTimePastesTable.slug, slug))

				// Notify ALL clients. Including the one that sent the event
				io.to(slug).emit('meta-change', { title, syntax })
			} catch (err) {
				console.error(`[WS] Failed to sync metadata for ${slug}:`, err)
			}
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
