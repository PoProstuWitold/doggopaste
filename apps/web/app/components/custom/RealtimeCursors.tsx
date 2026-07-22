'use client'

import { useEffect, useRef, useState } from 'react'
import { FaMousePointer } from 'react-icons/fa'
import type { Socket } from 'socket.io-client'
import { getContrastTextColor } from '../../utils/functions'
import type {
	CursorSelection,
	RealtimeEventAck,
	RemoteCursorMove
} from './realtime/socket-contract'

const generateRandomColor = () =>
	`#${Math.floor(Math.random() * 16777215)
		.toString(16)
		.padStart(6, '0')}`

type CursorPosition = {
	x: number
	y: number
	name: string
	lastSeen: number
}

const CURSOR_TTL_MS = 15_000
const CURSOR_CLEANUP_INTERVAL_MS = 5_000
const CURSOR_EMIT_INTERVAL_MS = 100

export const RealtimeCursors = ({
	name,
	socket,
	enabled,
	getSelection,
	getRevision
}: {
	name?: string
	socket: Socket | null
	enabled: boolean
	getSelection: () => CursorSelection
	getRevision: () => number
}) => {
	const [cursors, setCursors] = useState<Record<string, CursorPosition>>({})
	const colorsRef = useRef<Record<string, string>>({})
	const actualNameRef = useRef(
		name || `Anon${Math.floor(1000 + Math.random() * 9000)}`
	)

	useEffect(() => {
		if (name) actualNameRef.current = name
	}, [name])

	useEffect(() => {
		let animationFrameId: number | null = null
		let lastEmitAt = 0

		const handleMouseMove = (e: MouseEvent) => {
			if (animationFrameId) return
			if (Date.now() - lastEmitAt < CURSOR_EMIT_INTERVAL_MS) return
			lastEmitAt = Date.now()

			animationFrameId = requestAnimationFrame(() => {
				if (!enabled || !socket?.connected) {
					animationFrameId = null
					return
				}

				const selection = getSelection()
				socket.emit(
					'cursor-move',
					{
						x: e.clientX,
						y: e.clientY,
						name: actualNameRef.current,
						viewportWidth: window.innerWidth,
						viewportHeight: window.innerHeight,
						position: selection.head,
						selection
					},
					(_ack: RealtimeEventAck) => undefined
				)
				animationFrameId = null
			})
		}

		window.addEventListener('mousemove', handleMouseMove)
		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
			if (animationFrameId) cancelAnimationFrame(animationFrameId)
		}
	}, [enabled, getSelection, socket])

	useEffect(() => {
		const clearCursors = () => {
			setCursors({})
			colorsRef.current = {}
		}

		const handleCursor = ({
			id,
			x,
			y,
			name,
			viewportWidth,
			viewportHeight,
			revision
		}: RemoteCursorMove) => {
			if (revision < getRevision() || id === socket?.id) return
			if (!colorsRef.current[id]) {
				colorsRef.current[id] = generateRandomColor()
			}

			const relativeX =
				typeof viewportWidth === 'number' && viewportWidth > 0
					? (x / viewportWidth) * window.innerWidth
					: x
			const relativeY =
				typeof viewportHeight === 'number' && viewportHeight > 0
					? (y / viewportHeight) * window.innerHeight
					: y

			setCursors((prev) => ({
				...prev,
				[id]: {
					x: relativeX,
					y: relativeY,
					name: name || 'Guest',
					lastSeen: Date.now()
				}
			}))
		}

		const handleCursorLeave = ({ id }: { id: string }) => {
			setCursors((prev) => {
				const updated = { ...prev }
				delete updated[id]
				return updated
			})
			delete colorsRef.current[id]
		}

		socket?.on('cursor-move', handleCursor)
		socket?.on('cursor-leave', handleCursorLeave)
		socket?.on('connect', clearCursors)
		socket?.on('disconnect', clearCursors)

		const cleanupInterval = window.setInterval(() => {
			const threshold = Date.now() - CURSOR_TTL_MS
			setCursors((previous) => {
				const active = Object.fromEntries(
					Object.entries(previous).filter(([id, cursor]) => {
						const keep = cursor.lastSeen >= threshold
						if (!keep) delete colorsRef.current[id]
						return keep
					})
				)
				return Object.keys(active).length ===
					Object.keys(previous).length
					? previous
					: active
			})
		}, CURSOR_CLEANUP_INTERVAL_MS)

		return () => {
			window.clearInterval(cleanupInterval)
			socket?.off('cursor-move', handleCursor)
			socket?.off('cursor-leave', handleCursorLeave)
			socket?.off('connect', clearCursors)
			socket?.off('disconnect', clearCursors)
			clearCursors()
		}
	}, [getRevision, socket])

	return (
		<>
			{Object.entries(cursors).map(([id, { x, y, name }]) => (
				<div
					key={id}
					style={{
						position: 'fixed',
						left: x,
						top: y,
						transform: 'translate(-4px, -4px)',
						zIndex: 9999,
						pointerEvents: 'none',
						display: 'flex',
						alignItems: 'center',
						gap: 4
					}}
				>
					<FaMousePointer
						style={{
							color: colorsRef.current[id],
							fontSize: 16,
							filter: 'drop-shadow(0 0 1px black)'
						}}
					/>
					<div
						style={{
							backgroundColor: colorsRef.current[id],
							color: getContrastTextColor(
								colorsRef.current[id] || '#fff'
							),
							fontFamily: 'monospace',
							fontSize: 10,
							borderRadius: 4,
							padding: '1px 4px',
							boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
							whiteSpace: 'nowrap'
						}}
					>
						{name}
					</div>
				</div>
			))}
		</>
	)
}
