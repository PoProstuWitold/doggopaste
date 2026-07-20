// biome-ignore-all lint: test files
import { strictEqual } from 'node:assert'
import test from 'node:test'
import { isValidRealtimeSlug } from '../../src/utils/schemas.js'

test('isValidRealtimeSlug()', () => {
	strictEqual(isValidRealtimeSlug('A'), true)
	strictEqual(isValidRealtimeSlug(`A${'b'.repeat(63)}`), true)
	strictEqual(isValidRealtimeSlug('slug-With-Uppercase-123'), true)
	strictEqual(isValidRealtimeSlug(''), false)
	strictEqual(isValidRealtimeSlug('invalid_slug'), false)
	strictEqual(isValidRealtimeSlug('a'.repeat(65)), false)
})
