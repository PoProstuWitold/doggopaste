import { deepStrictEqual, strictEqual } from 'node:assert'
import test from 'node:test'
import {
	PASTE_DETAILS_DTO_KEYS,
	PASTE_SUMMARY_DTO_KEYS,
	toPasteDetailsDto,
	toPasteSummaryDto
} from '../../src/utils/paste-dto.js'
import {
	FOLDER_DTO_KEYS,
	REALTIME_PASTE_DTO_KEYS,
	SYNTAX_DTO_KEYS,
	toFolderDto,
	toRealtimePasteDto,
	toSyntaxDto
} from '../../src/utils/response-dto.js'

const createdAt = new Date('2026-01-01T00:00:00.000Z')
const updatedAt = new Date('2026-01-02T00:00:00.000Z')

test('folder DTO selects only public folder fields', () => {
	const dto = toFolderDto({
		id: '00000000-0000-4000-8000-000000000001',
		createdAt,
		updatedAt,
		name: 'Root',
		userId: '00000000-0000-4000-8000-000000000002',
		parentFolderId: null
	})

	deepStrictEqual(dto, {
		id: '00000000-0000-4000-8000-000000000001',
		createdAt,
		updatedAt,
		name: 'Root',
		userId: '00000000-0000-4000-8000-000000000002',
		parentFolderId: null
	})
	deepStrictEqual(Object.keys(dto).sort(), [...FOLDER_DTO_KEYS].sort())
})

test('realtime DTO cannot expose fields added to a database record', () => {
	const record = {
		id: '00000000-0000-4000-8000-000000000003',
		createdAt,
		updatedAt,
		title: 'Realtime',
		slug: 'realtime',
		content: 'content',
		revision: 0,
		syntaxId: null,
		visibility: 'public' as const,
		organizationId: null,
		internalOnly: 'must-not-leak'
	}
	const dto = toRealtimePasteDto(record)

	strictEqual('internalOnly' in dto, false)
	deepStrictEqual(Object.keys(dto).sort(), [...REALTIME_PASTE_DTO_KEYS].sort())
})

test('syntax DTO selects the documented public fields', () => {
	const dto = toSyntaxDto({
		id: '00000000-0000-4000-8000-000000000004',
		name: 'Plaintext',
		extension: 'txt',
		color: '#808080'
	})

	deepStrictEqual(dto, {
		id: '00000000-0000-4000-8000-000000000004',
		name: 'Plaintext',
		extension: 'txt',
		color: '#808080'
	})
	deepStrictEqual(Object.keys(dto).sort(), [...SYNTAX_DTO_KEYS].sort())
})

test('static paste DTO keys stay aligned with the public contract', () => {
	const source = {
		id: '00000000-0000-4000-8000-000000000005',
		createdAt,
		updatedAt,
		userId: '00000000-0000-4000-8000-000000000006',
		folderId: '00000000-0000-4000-8000-000000000007',
		title: 'Static',
		description: null,
		slug: 'static',
		category: 'snippet' as const,
		expiresAt: null,
		expiration: 'never' as const,
		encrypted: false,
		passwordProtected: true,
		hits: 2,
		visibility: 'public' as const,
		content: 'secret until authorized',
		passwordHash: 'must-not-leak'
	}
	const syntax = { name: 'Plaintext', extension: 'txt', color: '#808080' }
	const relations = { folderName: 'Examples', userName: 'doggo' }
	const summary = toPasteSummaryDto(source, syntax, ['tag'], relations)
	const details = toPasteDetailsDto(
		source,
		syntax,
		['tag'],
		true,
		relations
	)

	deepStrictEqual(Object.keys(summary).sort(), [
		...PASTE_SUMMARY_DTO_KEYS
	].sort())
	deepStrictEqual(Object.keys(details).sort(), [
		...PASTE_DETAILS_DTO_KEYS
	].sort())
	strictEqual('passwordHash' in summary, false)
	strictEqual('passwordHash' in details, false)
	strictEqual(summary.folderName, 'Examples')
	strictEqual(summary.userName, 'doggo')

	const anonymousSummary = toPasteSummaryDto(
		{ ...source, folderId: null, userId: null },
		syntax,
		[],
		relations
	)
	strictEqual(anonymousSummary.folderName, null)
	strictEqual(anonymousSummary.userName, null)

	const missingRelationsSummary = toPasteSummaryDto(source, syntax, [], {
		folderName: null,
		userName: null
	})
	strictEqual(missingRelationsSummary.folderId, source.folderId)
	strictEqual(missingRelationsSummary.folderName, null)
	strictEqual(missingRelationsSummary.userId, source.userId)
	strictEqual(missingRelationsSummary.userName, null)
})
