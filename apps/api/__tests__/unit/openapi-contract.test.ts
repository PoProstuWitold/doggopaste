// biome-ignore-all lint: contract fixtures inspect generated JSON dynamically
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { deepStrictEqual, strictEqual } from 'node:assert'
import test from 'node:test'
import {
	PASTE_DETAILS_DTO_KEYS,
	PASTE_SUMMARY_DTO_KEYS
} from '../../src/utils/paste-dto.js'
import {
	FOLDER_DTO_KEYS,
	REALTIME_PASTE_DTO_KEYS,
	REALTIME_VIEWER_DTO_KEYS
} from '../../src/utils/response-dto.js'
import { REQUEST_LIMITS } from '../../src/utils/request-limits.js'

const executeFile = promisify(execFile)
const apiRoot = fileURLToPath(new URL('../..', import.meta.url))
const openApiPath = fileURLToPath(
	new URL('../../openapi/openapi.json', import.meta.url)
)

test(
	'committed OpenAPI matches deterministic generation',
	{ timeout: 180_000 },
	async () => {
		await executeFile(
			process.execPath,
			['--import', 'tsx', 'scripts/check-openapi-drift.mjs'],
			{ cwd: apiRoot }
		)
	}
)

test('OpenAPI exposes the safe realtime viewer contract', async () => {
	const spec = JSON.parse(await readFile(openApiPath, 'utf8')) as any
	const serialized = JSON.stringify(spec)

	strictEqual(serialized.includes('passwordHash'), false)
	strictEqual(serialized.includes('sessionToken'), false)
	deepStrictEqual(spec.components?.schemas?.Viewer, {
		type: 'object',
		additionalProperties: false,
		required: [...REALTIME_VIEWER_DTO_KEYS],
		properties: { name: { type: 'string' } }
	})
	strictEqual(
		spec.paths['/pastes-realtime/{slug}'].post.responses['200'].content[
			'application/json'
		].schema.$ref,
		'#/components/schemas/RealtimeCreateResponse'
	)
	strictEqual(
		spec.components.schemas.RealtimeCreateResponse.properties.viewer.oneOf[0]
			.$ref,
		'#/components/schemas/Viewer'
	)
})

test('OpenAPI response schemas stay aligned with API DTO keys', async () => {
	const spec = JSON.parse(await readFile(openApiPath, 'utf8')) as any
	const schemas = spec.components.schemas

	deepStrictEqual(Object.keys(schemas.PasteSummary.properties).sort(), [
		...PASTE_SUMMARY_DTO_KEYS
	].sort())
	deepStrictEqual(Object.keys(schemas.PasteDetails.properties).sort(), [
		...PASTE_DETAILS_DTO_KEYS
	].sort())
	deepStrictEqual(Object.keys(schemas.RealtimePasteRecord.properties).sort(), [
		...REALTIME_PASTE_DTO_KEYS
	].sort())
	deepStrictEqual(Object.keys(schemas.Folder.properties).sort(), [
		...FOLDER_DTO_KEYS
	].sort())
})

test('OpenAPI publishes the implemented REST limits and concrete errors', async () => {
	const spec = JSON.parse(await readFile(openApiPath, 'utf8')) as any
	const schemas = spec.components.schemas
	const paths = spec.paths

	strictEqual(
		schemas.CreatePasteRequest.properties.content.maxLength,
		REQUEST_LIMITS.paste.content
	)
	strictEqual(
		schemas.CreatePasteRequest.properties.password.oneOf[0].maxLength,
		REQUEST_LIMITS.paste.password
	)
	strictEqual(
		schemas.CreatePasteRequest.properties.tags.maxItems,
		REQUEST_LIMITS.paste.tags
	)
	strictEqual(
		paths['/pastes/{slug}/verify'].post.requestBody.content[
			'application/json'
		].schema.$ref,
		'#/components/schemas/VerifyPasswordRequest'
	)
	strictEqual(
		paths['/pastes/{slug}/download'].post.requestBody.content[
			'application/json'
		].schema.$ref,
		'#/components/schemas/DownloadPasswordRequest'
	)
	strictEqual(
		paths['/pastes/{slug}/verify'].post.responses['429'].headers[
			'Retry-After'
		].required,
		true
	)
	strictEqual(paths['/pastes'].post.responses['413'] !== undefined, true)
	strictEqual('security' in spec, false)
})
