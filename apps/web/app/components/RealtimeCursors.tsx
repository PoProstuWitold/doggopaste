'use client'

import { useEffect, useRef, useState } from 'react'
import { FaMousePointer } from 'react-icons/fa'
import type { Socket } from 'socket.io-client'
import { getContrastTextColor } from '../utils/functions'

const generateRandomColor = () =>
	`#${Math.floor(Math.random() * 16777215)
		.toString(16)
		.padStart(6, '0')}`

type CursorData = {
	id: string
	x: number
	y: number
	name?: string
}

export const RealtimeCursors = ({
	slug,
	name,
	socket
}: {
	slug: string
	name?: string
	socket: Socket | null
}) => {
	const [cursors, setCursors] = useState<
		Record<string, { x: number; y: number; name: string }>
	>({})
	const colorsRef = useRef<Record<string, string>>({})
	const actualNameRef = useRef(
		name || `Anon${Math.floor(1000 + Math.random() * 9000)}`
	)

	useEffect(() => {
		let animationFrameId: number | null = null

		const handleMouseMove = (e: MouseEvent) => {
			if (animationFrameId) return

			animationFrameId = requestAnimationFrame(() => {
				socket?.emit('cursor-move', {
					slug,
					x: e.clientX,
					y: e.clientY,
					name: actualNameRef.current
				})
				animationFrameId = null
			})
		}

		window.addEventListener('mousemove', handleMouseMove)
		return () => {
			window.removeEventListener('mousemove', handleMouseMove)
			if (animationFrameId) cancelAnimationFrame(animationFrameId)
		}
	}, [slug, socket])

	useEffect(() => {
		const handleCursor = ({ id, x, y, name }: CursorData) => {
			if (!colorsRef.current[id]) {
				colorsRef.current[id] = generateRandomColor()
			}

			setCursors((prev) => ({
				...prev,
				[id]: { x, y, name: name || 'Guest' }
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

		return () => {
			socket?.off('cursor-move', handleCursor)
			socket?.off('cursor-leave', handleCursorLeave)
		}
	}, [socket?.on, socket?.off])

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
