import type { Syntax } from '../../../types'

export type RealtimeSnapshot = {
	content: string
	title: string
	syntax: Syntax
	revision: number
}

export type RealtimeAckError =
	| { status: 'validation_error' }
	| { status: 'not_joined' }
	| { status: 'room_mismatch' }
	| { status: 'rate_limited'; retryAfterMs: number }
	| { status: 'internal_error' }
	| {
			status: 'revision_conflict'
			revision: number
			snapshot: RealtimeSnapshot
	  }

export type RealtimeSuccessAck = {
	status: 'success'
	revision?: number
}

export type JoinRoomAck =
	| {
			status: 'success'
			revision: number
			snapshot: RealtimeSnapshot
	  }
	| RealtimeAckError

export type RealtimeWriteAck =
	| (RealtimeSuccessAck & { revision: number })
	| RealtimeAckError

export type RealtimeEventAck = RealtimeSuccessAck | RealtimeAckError

export type CodeChange = {
	from: number
	to: number
	insert: string
}

export type CodeChangeBatch = {
	changes: CodeChange[]
}

export type RemoteCodeChange = CodeChangeBatch & {
	sender: string
	revision: number
}

export type RemoteContentChange = {
	content: string
	revision: number
	sender: string
}

export type RemoteMetaChange = {
	title: string
	syntax: Syntax
	revision: number
	sender: string
}

export type CursorSelection = {
	anchor: number
	head: number
}

export type CursorMovePayload = {
	x: number
	y: number
	name: string
	viewportWidth: number
	viewportHeight: number
	position: number
	selection: CursorSelection
}

export type RemoteCursorMove = CursorMovePayload & {
	id: string
	revision: number
}

export type SaveResult =
	| 'success'
	| 'resynced'
	| 'retryable_error'
	| 'discarded'
