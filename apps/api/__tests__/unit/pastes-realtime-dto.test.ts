import { deepStrictEqual, strictEqual } from 'node:assert'
import test from 'node:test'
import { toRealtimeViewerDto } from '../../src/routes/pastes-realtime.js'
import { REALTIME_VIEWER_DTO_KEYS } from '../../src/utils/response-dto.js'

test('toRealtimeViewerDto exposes only the viewer name', () => {
	const viewer = toRealtimeViewerDto({
		session: {
			id: 'session-id',
			token: 'secret-session-token',
			userId: 'user-id',
			ipAddress: '127.0.0.1'
		},
		user: {
			id: 'user-id',
			name: 'Doggo',
			email: 'doggo@example.com',
			role: 'admin'
		}
	})

	deepStrictEqual(viewer, { name: 'Doggo' })
	deepStrictEqual(Object.keys(viewer ?? {}).sort(), [
		...REALTIME_VIEWER_DTO_KEYS
	].sort())
})

test('toRealtimeViewerDto rejects incomplete authentication data', () => {
	strictEqual(toRealtimeViewerDto(null), null)
	strictEqual(toRealtimeViewerDto({ user: { name: 'Doggo' } }), null)
	strictEqual(toRealtimeViewerDto({ session: {}, user: {} }), null)
})
