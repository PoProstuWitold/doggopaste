import {
	PASTE_SUMMARY_DTO_KEYS,
	PASTE_SYNTAX_DTO_KEYS
} from '../src/utils/paste-dto.ts'
import {
	REQUEST_LIMITS,
	REST_RATE_LIMITS
} from '../src/utils/request-limits.ts'
import {
	FOLDER_DTO_KEYS,
	REALTIME_PASTE_DTO_KEYS,
	REALTIME_VIEWER_DTO_KEYS,
	SYNTAX_DTO_KEYS
} from '../src/utils/response-dto.ts'

const STATIC_VISIBILITIES = ['public', 'private', 'unlisted', 'organization']

const CATEGORIES = [
	'none',
	'cryptocurrency',
	'cybersecurity',
	'fixit',
	'gaming',
	'help',
	'software',
	'note',
	'config',
	'question',
	'log',
	'project',
	'snippet',
	'education'
]

const EXPIRATIONS = ['never', 'burn_after_read', '10m', '1h', '1d', '1w', '2w']

const BODY_LIMIT_BYTES = REQUEST_LIMITS.jsonBodyBytes
const TITLE_MAX_LENGTH = REQUEST_LIMITS.paste.title
const CREATE_SLUG_MAX_LENGTH = REQUEST_LIMITS.paste.createSlug
const ROUTE_SLUG_MAX_LENGTH = REQUEST_LIMITS.paste.routeSlug
const DESCRIPTION_MAX_LENGTH = REQUEST_LIMITS.paste.description
const CONTENT_MAX_LENGTH = REQUEST_LIMITS.paste.content
const PASSWORD_MAX_LENGTH = REQUEST_LIMITS.paste.password
const TAGS_MAX_ITEMS = REQUEST_LIMITS.paste.tags
const TAG_MAX_LENGTH = REQUEST_LIMITS.paste.tag
const SYNTAX_MAX_LENGTH = REQUEST_LIMITS.paste.syntax
const HASH_RATE_LIMIT = REST_RATE_LIMITS.passwordHash
const VERIFY_RATE_LIMIT = REST_RATE_LIMITS.passwordVerify

const ref = (name) => ({ $ref: `#/components/schemas/${name}` })
const nullable = (schema) => ({ oneOf: [schema, { type: 'null' }] })

const successFlag = { type: 'boolean', const: true }
const uuid = { type: 'string', format: 'uuid' }
const dateTime = { type: 'string', format: 'date-time' }

function extendClosedObjectSchema(base, required, properties) {
	return {
		type: 'object',
		additionalProperties: false,
		required: [...base.required, ...required],
		properties: { ...base.properties, ...properties }
	}
}

const schemas = {
	ErrorDetail: {
		type: 'object',
		additionalProperties: { type: 'string' }
	},
	ApiError: {
		type: 'object',
		additionalProperties: false,
		required: ['statusCode', 'name', 'message'],
		properties: {
			statusCode: { type: 'integer', minimum: 400, maximum: 599 },
			name: { type: 'string' },
			message: { type: 'string' },
			details: {
				type: 'array',
				items: ref('ErrorDetail')
			}
		}
	},
	SimpleError: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'message'],
		properties: {
			success: { type: 'boolean', const: false },
			message: { type: 'string' }
		}
	},
	UserPastesBadRequest: {
		oneOf: [ref('ApiError'), ref('SimpleError')]
	},
	PasteSyntax: {
		type: 'object',
		additionalProperties: false,
		required: [...PASTE_SYNTAX_DTO_KEYS],
		properties: {
			name: { type: 'string' },
			extension: { type: 'string' },
			color: { type: 'string' }
		}
	},
	PasteSummary: {
		type: 'object',
		additionalProperties: false,
		required: [...PASTE_SUMMARY_DTO_KEYS],
		properties: {
			id: uuid,
			createdAt: dateTime,
			updatedAt: dateTime,
			userId: nullable(uuid),
			userName: nullable({ type: 'string' }),
			folderId: nullable(uuid),
			folderName: nullable({ type: 'string' }),
			title: { type: 'string' },
			description: { type: 'string' },
			slug: { type: 'string' },
			category: { type: 'string', enum: CATEGORIES },
			expiresAt: nullable(dateTime),
			expiration: { type: 'string', enum: EXPIRATIONS },
			encrypted: { type: 'boolean' },
			passwordProtected: { type: 'boolean' },
			hits: { type: 'integer', minimum: 0 },
			visibility: { type: 'string', enum: STATIC_VISIBILITIES },
			tags: {
				type: 'array',
				items: { type: 'string' }
			},
			syntax: ref('PasteSyntax')
		}
	},
	PasteDetails: null,
	PasteDetailsResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data'],
		properties: {
			success: successFlag,
			data: ref('PasteDetails')
		}
	},
	PasteListResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data', 'total'],
		properties: {
			success: successFlag,
			data: { type: 'array', items: ref('PasteSummary') },
			total: { type: 'integer', minimum: 0 }
		}
	},
	CreatePasteRequest: {
		type: 'object',
		additionalProperties: true,
		required: ['title', 'slug', 'content', 'syntax'],
		properties: {
			title: {
				type: 'string',
				minLength: 1,
				maxLength: TITLE_MAX_LENGTH
			},
			slug: {
				type: 'string',
				maxLength: CREATE_SLUG_MAX_LENGTH,
				pattern: '^(?:[a-z0-9-]+)?$'
			},
			description: {
				type: 'string',
				maxLength: DESCRIPTION_MAX_LENGTH,
				default: ''
			},
			content: {
				type: 'string',
				minLength: 1,
				maxLength: CONTENT_MAX_LENGTH
			},
			category: { type: 'string', enum: CATEGORIES, default: 'none' },
			tags: {
				type: 'array',
				maxItems: TAGS_MAX_ITEMS,
				default: [],
				items: {
					type: 'string',
					minLength: 1,
					maxLength: TAG_MAX_LENGTH,
					pattern: '^[a-z][a-z0-9]*$'
				}
			},
			syntax: {
				type: 'string',
				minLength: 1,
				maxLength: SYNTAX_MAX_LENGTH
			},
			expiration: {
				type: 'string',
				enum: EXPIRATIONS,
				default: 'never'
			},
			visibility: {
				type: 'string',
				enum: ['public', 'private', 'unlisted'],
				default: 'public'
			},
			folder: {
				oneOf: [{ type: 'string', const: 'none' }, uuid],
				default: 'none'
			},
			pasteAsGuest: { type: 'boolean', default: false },
			passwordEnabled: { type: 'boolean', default: false },
			password: nullable({
				type: 'string',
				maxLength: PASSWORD_MAX_LENGTH
			}),
			encrypted: { type: 'boolean', default: false }
		},
		allOf: [
			{
				if: {
					required: ['passwordEnabled'],
					properties: {
						passwordEnabled: { const: true },
						encrypted: { const: false }
					}
				},
				// biome-ignore lint/suspicious/noThenProperty: JSON Schema conditional keyword
				then: {
					required: ['password'],
					properties: {
						password: {
							type: 'string',
							minLength: 1,
							maxLength: PASSWORD_MAX_LENGTH,
							pattern: '\\S'
						}
					}
				}
			},
			{
				if: {
					required: ['pasteAsGuest'],
					properties: { pasteAsGuest: { const: true } }
				},
				// biome-ignore lint/suspicious/noThenProperty: JSON Schema conditional keyword
				then: {
					properties: {
						visibility: {
							type: 'string',
							enum: ['public', 'unlisted']
						},
						folder: { type: 'string', const: 'none' }
					}
				}
			}
		]
	},
	UpdatePasteRequest: null,
	VerifyPasswordRequest: {
		type: 'object',
		additionalProperties: true,
		required: ['password'],
		properties: {
			password: {
				type: 'string',
				minLength: 1,
				maxLength: PASSWORD_MAX_LENGTH
			}
		}
	},
	DownloadPasswordRequest: {
		type: 'object',
		additionalProperties: true,
		required: ['password'],
		properties: {
			password: {
				type: 'string',
				minLength: 1,
				maxLength: PASSWORD_MAX_LENGTH,
				pattern: '\\S'
			}
		}
	},
	VerifyPasteResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'content'],
		properties: {
			success: successFlag,
			content: { type: 'string' }
		}
	},
	RealtimeSyntax: {
		type: 'object',
		additionalProperties: false,
		required: ['name', 'extension', 'color'],
		properties: {
			name: { type: 'string' },
			extension: nullable({ type: 'string' }),
			color: { type: 'string' }
		}
	},
	RealtimePasteRecord: {
		type: 'object',
		additionalProperties: false,
		required: [...REALTIME_PASTE_DTO_KEYS],
		properties: {
			id: uuid,
			createdAt: dateTime,
			updatedAt: dateTime,
			title: { type: 'string' },
			slug: {
				type: 'string',
				minLength: 1,
				maxLength: ROUTE_SLUG_MAX_LENGTH
			},
			content: { type: 'string' },
			revision: { type: 'integer', minimum: 0 },
			syntaxId: nullable(uuid),
			visibility: { type: 'string', enum: STATIC_VISIBILITIES },
			organizationId: nullable(uuid)
		}
	},
	RealtimePaste: null,
	Viewer: {
		type: 'object',
		additionalProperties: false,
		required: [...REALTIME_VIEWER_DTO_KEYS],
		properties: {
			name: { type: 'string' }
		}
	},
	RealtimeCreateRequest: {
		type: 'object',
		additionalProperties: true,
		properties: {
			token: nullable({ type: 'string' })
		}
	},
	RealtimeCreateResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'realtimePaste', 'viewer'],
		properties: {
			success: successFlag,
			realtimePaste: ref('RealtimePaste'),
			viewer: nullable(ref('Viewer'))
		}
	},
	RealtimePasteResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data'],
		properties: {
			success: successFlag,
			data: ref('RealtimePaste')
		}
	},
	Folder: {
		type: 'object',
		additionalProperties: false,
		required: [...FOLDER_DTO_KEYS],
		properties: {
			id: uuid,
			createdAt: dateTime,
			updatedAt: dateTime,
			userId: uuid,
			name: { type: 'string' },
			parentFolderId: nullable(uuid)
		}
	},
	FolderWithCounts: null,
	FolderResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data'],
		properties: {
			success: successFlag,
			data: ref('Folder')
		}
	},
	FolderListResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data'],
		properties: {
			success: successFlag,
			data: { type: 'array', items: ref('Folder') }
		}
	},
	FolderCountListResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data'],
		properties: {
			success: successFlag,
			data: { type: 'array', items: ref('FolderWithCounts') }
		}
	},
	FolderDetailsResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data'],
		properties: {
			success: successFlag,
			data: {
				type: 'object',
				additionalProperties: false,
				required: ['folder', 'pastes'],
				properties: {
					folder: ref('FolderWithCounts'),
					pastes: { type: 'array', items: ref('PasteSummary') }
				}
			}
		}
	},
	CreateFolderRequest: {
		type: 'object',
		additionalProperties: true,
		required: ['name'],
		properties: {
			name: {
				type: 'string',
				minLength: 3,
				maxLength: 40,
				pattern: '^[A-Za-z][A-Za-z0-9]*$'
			},
			parentId: nullable(uuid)
		}
	},
	UpdateFolderRequest: {
		type: 'object',
		additionalProperties: true,
		required: ['name'],
		properties: {
			name: {
				type: 'string',
				minLength: 3,
				maxLength: 40,
				pattern: '^[A-Za-z][A-Za-z0-9]*$'
			}
		}
	},
	DeleteFolderResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'deleted'],
		properties: {
			success: successFlag,
			deleted: { type: 'integer', minimum: 1 }
		}
	},
	PublicUser: {
		type: 'object',
		additionalProperties: false,
		required: ['id', 'name', 'createdAt', 'role'],
		properties: {
			id: uuid,
			name: { type: 'string' },
			createdAt: dateTime,
			role: nullable({ type: 'string' })
		}
	},
	PublicUserResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data'],
		properties: {
			success: successFlag,
			data: ref('PublicUser')
		}
	},
	MessageResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'message'],
		properties: {
			success: successFlag,
			message: { type: 'string' }
		}
	},
	AdminUserSummary: {
		type: 'object',
		additionalProperties: false,
		required: ['id', 'name'],
		properties: { id: uuid, name: { type: 'string' } }
	},
	AdminSyntax: {
		type: 'object',
		additionalProperties: false,
		required: [...SYNTAX_DTO_KEYS],
		properties: {
			id: uuid,
			name: { type: 'string' },
			extension: nullable({ type: 'string' }),
			color: { type: 'string' }
		}
	},
	AdminStaticPaste: {
		type: 'object',
		additionalProperties: false,
		required: [
			'id',
			'title',
			'slug',
			'visibility',
			'createdAt',
			'updatedAt'
		],
		properties: {
			id: uuid,
			title: { type: 'string' },
			slug: nullable({ type: 'string' }),
			visibility: { type: 'string', enum: STATIC_VISIBILITIES },
			createdAt: dateTime,
			updatedAt: dateTime
		}
	},
	AdminStaticPasteItem: {
		type: 'object',
		additionalProperties: false,
		required: ['paste', 'user', 'syntax'],
		properties: {
			paste: ref('AdminStaticPaste'),
			user: nullable(ref('AdminUserSummary')),
			syntax: nullable(ref('AdminSyntax'))
		}
	},
	AdminStaticPasteListResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data'],
		properties: {
			success: successFlag,
			data: {
				type: 'object',
				additionalProperties: false,
				required: ['pastes'],
				properties: {
					pastes: {
						type: 'array',
						items: ref('AdminStaticPasteItem')
					}
				}
			}
		}
	},
	AdminRealtimePasteItem: {
		type: 'object',
		additionalProperties: false,
		required: ['paste', 'syntax'],
		properties: {
			paste: ref('RealtimePasteRecord'),
			syntax: nullable(ref('RealtimeSyntax'))
		}
	},
	AdminRealtimePasteListResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data'],
		properties: {
			success: successFlag,
			data: {
				type: 'object',
				additionalProperties: false,
				required: ['realtimePastes'],
				properties: {
					realtimePastes: {
						type: 'array',
						items: ref('AdminRealtimePasteItem')
					}
				}
			}
		}
	},
	AdminTag: {
		type: 'object',
		additionalProperties: false,
		required: ['id', 'name'],
		properties: { id: uuid, name: { type: 'string' } }
	},
	AdminTagListResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data'],
		properties: {
			success: successFlag,
			data: {
				type: 'object',
				additionalProperties: false,
				required: ['tags'],
				properties: {
					tags: { type: 'array', items: ref('AdminTag') }
				}
			}
		}
	},
	AdminSyntaxListResponse: {
		type: 'object',
		additionalProperties: false,
		required: ['success', 'data'],
		properties: {
			success: successFlag,
			data: {
				type: 'object',
				additionalProperties: false,
				required: ['syntaxes'],
				properties: {
					syntaxes: { type: 'array', items: ref('AdminSyntax') }
				}
			}
		}
	},
	UpdateSyntaxRequest: {
		type: 'object',
		additionalProperties: true,
		required: ['name', 'color'],
		properties: {
			name: { type: 'string', minLength: 1, maxLength: 64 },
			extension: nullable({
				type: 'string',
				maxLength: 32,
				pattern: '^(?:[a-zA-Z0-9]+(?:\\.[a-zA-Z0-9]+)*)?$'
			}),
			color: { type: 'string', minLength: 1, maxLength: 32 }
		}
	},
	HealthOk: {
		type: 'object',
		additionalProperties: false,
		required: [
			'status',
			'description',
			'version',
			'uptime',
			'timestamp',
			'isDocker',
			'node',
			'services'
		],
		properties: {
			status: { type: 'string', const: 'ok' },
			description: { type: 'string' },
			version: { type: 'string' },
			uptime: { type: 'number', minimum: 0 },
			timestamp: dateTime,
			isDocker: { type: 'boolean' },
			node: { type: 'string' },
			services: {
				type: 'object',
				additionalProperties: false,
				required: ['postgres'],
				properties: {
					postgres: {
						type: 'object',
						additionalProperties: false,
						required: ['connected', 'latencyMs'],
						properties: {
							connected: { type: 'boolean', const: true },
							latencyMs: { type: 'integer', minimum: 0 }
						}
					}
				}
			}
		}
	},
	HealthDegraded: {
		type: 'object',
		additionalProperties: false,
		required: [
			'status',
			'description',
			'version',
			'uptime',
			'timestamp',
			'isDocker',
			'node',
			'services'
		],
		properties: {
			status: { type: 'string', const: 'degraded' },
			description: { type: 'string' },
			version: { type: 'string' },
			uptime: { type: 'number', minimum: 0 },
			timestamp: dateTime,
			isDocker: { type: 'boolean' },
			node: { type: 'string' },
			services: {
				type: 'object',
				additionalProperties: false,
				required: ['postgres'],
				properties: {
					postgres: {
						type: 'object',
						additionalProperties: false,
						required: ['connected', 'error'],
						properties: {
							connected: { type: 'boolean', const: false },
							error: { type: 'string', const: 'unavailable' }
						}
					}
				}
			}
		}
	}
}

schemas.PasteDetails = extendClosedObjectSchema(
	schemas.PasteSummary,
	['content'],
	{ content: { type: 'string' } }
)
schemas.UpdatePasteRequest = {
	...schemas.CreatePasteRequest,
	allOf: [schemas.CreatePasteRequest.allOf[0]]
}
schemas.RealtimePaste = extendClosedObjectSchema(
	schemas.RealtimePasteRecord,
	['syntax'],
	{ syntax: ref('RealtimeSyntax') }
)
schemas.FolderWithCounts = extendClosedObjectSchema(
	schemas.Folder,
	['subfoldersCount', 'pastesCount'],
	{
		subfoldersCount: { type: 'integer', minimum: 0 },
		pastesCount: { type: 'integer', minimum: 0 }
	}
)

const jsonBody = (schema, required = true) => ({
	required,
	content: {
		'application/json': { schema }
	}
})

const jsonResponse = (schema, description, headers) => ({
	description,
	...(headers ? { headers } : {}),
	content: {
		'application/json': { schema }
	}
})

const noStoreHeader = {
	description: 'Prevents storage of the response.',
	required: true,
	schema: { type: 'string', const: 'no-store' }
}

const attachmentHeader = {
	description: 'Attachment filename derived from the sanitized paste title.',
	required: true,
	schema: { type: 'string', pattern: '^attachment; filename=".+"$' }
}

const retryAfterHeader = {
	description: 'Seconds until another request can be attempted.',
	required: true,
	schema: { type: 'integer', minimum: 1 }
}

const error = (description, options = {}) => {
	const headers = {
		...(options.noStore ? { 'Cache-Control': noStoreHeader } : {}),
		...(options.retryAfter ? { 'Retry-After': retryAfterHeader } : {})
	}

	return jsonResponse(
		ref(options.simple ? 'SimpleError' : 'ApiError'),
		description,
		Object.keys(headers).length > 0 ? headers : undefined
	)
}

const ok = (schema, description = 'Success') =>
	jsonResponse(ref(schema), description)

const text = (description, headers = {}) => ({
	description,
	...(Object.keys(headers).length > 0 ? { headers } : {}),
	content: {
		'text/plain; charset=utf-8': { schema: { type: 'string' } }
	}
})

const download = (description, noStore = false) =>
	text(description, {
		'Content-Disposition': attachmentHeader,
		...(noStore ? { 'Cache-Control': noStoreHeader } : {})
	})

const staticSlug = {
	name: 'slug',
	in: 'path',
	required: true,
	schema: { type: 'string', minLength: 1, maxLength: ROUTE_SLUG_MAX_LENGTH }
}

const realtimeSlug = {
	name: 'slug',
	in: 'path',
	required: true,
	schema: {
		type: 'string',
		minLength: 1,
		maxLength: ROUTE_SLUG_MAX_LENGTH,
		pattern: '^[A-Za-z0-9-]+$'
	}
}

const id = {
	name: 'id',
	in: 'path',
	required: true,
	schema: uuid
}

const optionalSession = [{}, { sessionCookie: [] }, { secureSessionCookie: [] }]
const sessionRequired = [{ sessionCookie: [] }, { secureSessionCookie: [] }]
const publicAccess = []

const common500 = error('Unexpected server error.')
const body413 = error(
	`Request body exceeds the ${BODY_LIMIT_BYTES}-byte limit.`
)
const password429 = error(
	`Password verification limit exceeded: ${VERIFY_RATE_LIMIT.max} attempts per ${VERIFY_RATE_LIMIT.windowMs / 1000} seconds per IP and paste.`,
	{ retryAfter: true }
)
const hash429 = error(
	`Password hashing limit exceeded: ${HASH_RATE_LIMIT.max} attempts per ${HASH_RATE_LIMIT.windowMs / 1000} seconds per IP.`,
	{ retryAfter: true }
)

const generatedContracts = {
	'POST /pastes': {
		security: optionalSession,
		requestBody: jsonBody(ref('CreatePasteRequest')),
		responses: {
			201: ok('PasteDetailsResponse', 'Paste created.'),
			400: error('Invalid paste data.'),
			401: error('Authentication is required for a private paste.'),
			404: error('Selected folder was not found.'),
			409: error('Slug or another unique value already exists.'),
			413: body413,
			429: hash429,
			500: common500
		}
	},
	'GET /pastes': {
		security: publicAccess,
		parameters: [
			{
				name: 'limit',
				in: 'query',
				required: false,
				schema: {
					type: 'integer',
					minimum: 1,
					maximum: 100,
					default: 10
				}
			},
			{
				name: 'offset',
				in: 'query',
				required: false,
				schema: { type: 'integer', minimum: 0, default: 0 }
			}
		],
		responses: {
			200: ok('PasteListResponse'),
			400: error('Invalid pagination parameters.'),
			500: common500
		}
	},
	'GET /pastes/{slug}': {
		security: optionalSession,
		parameters: [staticSlug],
		responses: {
			200: ok('PasteDetailsResponse'),
			400: error('Invalid slug.'),
			404: error(
				'Paste is missing, expired, private, or no longer readable.'
			),
			500: common500
		}
	},
	'POST /pastes/{slug}/verify': {
		security: optionalSession,
		parameters: [staticSlug],
		requestBody: jsonBody(ref('VerifyPasswordRequest')),
		responses: {
			200: ok('VerifyPasteResponse', 'Password accepted.'),
			400: error('Invalid body, missing password, or unprotected paste.'),
			403: error('Password is incorrect.'),
			404: error(
				'Paste is missing, expired, private, or no longer readable.'
			),
			413: body413,
			429: password429,
			500: common500
		}
	},
	'PUT /pastes/{slug}': {
		security: sessionRequired,
		parameters: [staticSlug],
		requestBody: jsonBody(ref('UpdatePasteRequest')),
		responses: {
			200: ok('PasteDetailsResponse', 'Paste updated.'),
			400: error('Invalid paste data.'),
			401: error('Authentication is required.'),
			403: error('The authenticated user does not own the paste.'),
			404: error('Paste or selected folder was not found.'),
			409: error('Slug or another unique value already exists.'),
			413: body413,
			429: hash429,
			500: common500
		}
	},
	'DELETE /pastes/{slug}': {
		security: sessionRequired,
		parameters: [staticSlug],
		responses: {
			200: ok('MessageResponse', 'Paste deleted.'),
			400: error('Invalid slug.'),
			401: error('Authentication is required.'),
			403: error('The authenticated user does not own the paste.'),
			404: error('Paste was not found.'),
			500: common500
		}
	},
	'GET /pastes/{slug}/download': {
		security: optionalSession,
		parameters: [staticSlug],
		responses: {
			200: download(
				'Paste content delivered as a UTF-8 text file.',
				true
			),
			400: error(
				'Invalid slug or a forbidden password query was supplied.',
				{
					noStore: true
				}
			),
			401: error('A password is required; use POST with a JSON body.', {
				noStore: true
			}),
			404: error('Paste is missing, expired, private, or inaccessible.', {
				noStore: true
			}),
			500: error('Unexpected server error.', { noStore: true })
		}
	},
	'POST /pastes/{slug}/download': {
		security: optionalSession,
		parameters: [staticSlug],
		requestBody: jsonBody(ref('DownloadPasswordRequest')),
		responses: {
			200: download(
				'Paste content delivered as a UTF-8 text file.',
				true
			),
			400: error(
				'Invalid body, missing password, or unprotected paste.',
				{
					noStore: true
				}
			),
			403: error('Password is incorrect.', { noStore: true }),
			404: error('Paste is missing, expired, private, or inaccessible.', {
				noStore: true
			}),
			413: body413,
			429: error(
				`Password verification limit exceeded: ${VERIFY_RATE_LIMIT.max} attempts per ${VERIFY_RATE_LIMIT.windowMs / 1000} seconds per IP and paste.`,
				{ noStore: true, retryAfter: true }
			),
			500: error('Unexpected server error.', { noStore: true })
		}
	},
	'POST /pastes-realtime/{slug}': {
		security: publicAccess,
		parameters: [realtimeSlug],
		requestBody: jsonBody(ref('RealtimeCreateRequest'), false),
		responses: {
			200: ok('RealtimeCreateResponse'),
			400: error('Invalid realtime slug.'),
			413: body413,
			500: common500
		}
	},
	'GET /pastes-realtime/{slug}': {
		security: publicAccess,
		parameters: [realtimeSlug],
		responses: {
			200: ok('RealtimePasteResponse'),
			400: error('Invalid realtime slug.'),
			404: error('Realtime paste was not found.'),
			500: common500
		}
	},
	'GET /pastes-realtime/{slug}/download': {
		security: publicAccess,
		parameters: [realtimeSlug],
		responses: {
			200: download(
				'Realtime paste content delivered as a UTF-8 text file.'
			),
			400: error('Invalid realtime slug.'),
			404: error('Realtime paste was not found.'),
			500: common500
		}
	},
	'POST /folders': {
		security: sessionRequired,
		requestBody: jsonBody(ref('CreateFolderRequest')),
		responses: {
			200: ok('FolderResponse', 'Existing folder returned.'),
			201: ok('FolderResponse', 'Folder created.'),
			400: error('Invalid folder data.'),
			401: error('Authentication is required.'),
			404: error('Parent folder was not found.'),
			413: body413,
			500: common500
		}
	},
	'GET /folders': {
		security: sessionRequired,
		parameters: [
			{
				name: 'parentId',
				in: 'query',
				required: false,
				schema: {
					oneOf: [uuid, { type: 'string', const: 'null' }]
				}
			}
		],
		responses: {
			200: ok('FolderListResponse'),
			400: error('Invalid parentId.'),
			401: error('Authentication is required.'),
			500: common500
		}
	},
	'GET /folders/all': {
		security: sessionRequired,
		responses: {
			200: ok('FolderCountListResponse'),
			401: error('Authentication is required.'),
			500: common500
		}
	},
	'PATCH /folders/{id}': {
		security: sessionRequired,
		parameters: [id],
		requestBody: jsonBody(ref('UpdateFolderRequest')),
		responses: {
			200: ok('FolderResponse', 'Folder updated.'),
			400: error('Invalid folder id or body.'),
			401: error('Authentication is required.'),
			404: error('Folder was not found.'),
			409: error('A folder with that name already exists.'),
			413: body413,
			500: common500
		}
	},
	'DELETE /folders/{id}': {
		security: sessionRequired,
		parameters: [id],
		responses: {
			200: ok('DeleteFolderResponse', 'Folder tree deleted.'),
			400: error('Invalid folder id.'),
			401: error('Authentication is required.'),
			404: error('Folder was not found.'),
			500: common500
		}
	},
	'GET /folders/f/{id}': {
		security: sessionRequired,
		parameters: [id],
		responses: {
			200: ok('FolderDetailsResponse'),
			400: error('Invalid folder id.'),
			401: error('Authentication is required.'),
			404: error('Folder was not found.'),
			500: common500
		}
	},
	'GET /user/pastes': {
		security: optionalSession,
		parameters: [
			{
				name: 'limit',
				in: 'query',
				required: false,
				schema: {
					type: 'integer',
					minimum: 1,
					maximum: 100,
					default: 10
				}
			},
			{
				name: 'offset',
				in: 'query',
				required: false,
				schema: { type: 'integer', minimum: 0, default: 0 }
			},
			{
				name: 'userId',
				in: 'query',
				required: false,
				schema: uuid
			}
		],
		responses: {
			200: ok('PasteListResponse'),
			400: jsonResponse(
				ref('UserPastesBadRequest'),
				'Invalid user or pagination parameters.'
			),
			500: common500
		}
	},
	'GET /user/name/{name}': {
		security: publicAccess,
		parameters: [
			{
				name: 'name',
				in: 'path',
				required: true,
				schema: { type: 'string', minLength: 1 }
			}
		],
		responses: {
			200: ok('PublicUserResponse'),
			400: error('Missing or empty user name.', { simple: true }),
			404: error('User was not found.', { simple: true }),
			500: common500
		}
	},
	'GET /admin/pastes': {
		security: sessionRequired,
		responses: {
			200: ok('AdminStaticPasteListResponse'),
			401: error('Authentication is required.'),
			403: error('Administrator access is required.'),
			500: common500
		}
	},
	'GET /admin/pastes-realtime': {
		security: sessionRequired,
		responses: {
			200: ok('AdminRealtimePasteListResponse'),
			401: error('Authentication is required.'),
			403: error('Administrator access is required.'),
			500: common500
		}
	},
	'DELETE /admin/users/{id}': {
		security: sessionRequired,
		parameters: [id],
		responses: {
			200: ok('MessageResponse', 'User deleted.'),
			400: error('Invalid user id.'),
			401: error('Authentication is required.'),
			403: error('Administrator access is required.'),
			404: error('User was not found.'),
			500: common500
		}
	},
	'GET /admin/tags': {
		security: sessionRequired,
		responses: {
			200: ok('AdminTagListResponse'),
			401: error('Authentication is required.'),
			403: error('Administrator access is required.'),
			500: common500
		}
	},
	'GET /admin/syntaxes': {
		security: sessionRequired,
		responses: {
			200: ok('AdminSyntaxListResponse'),
			401: error('Authentication is required.'),
			403: error('Administrator access is required.'),
			500: common500
		}
	},
	'DELETE /admin/pastes/{id}': {
		security: sessionRequired,
		parameters: [id],
		responses: {
			200: ok('MessageResponse', 'Paste deleted.'),
			400: error('Invalid paste id.'),
			401: error('Authentication is required.'),
			403: error('Administrator access is required.'),
			404: error('Paste was not found.'),
			500: common500
		}
	},
	'DELETE /admin/pastes-realtime/{id}': {
		security: sessionRequired,
		parameters: [id],
		responses: {
			200: ok('MessageResponse', 'Realtime paste deleted.'),
			400: error('Invalid realtime paste id.'),
			401: error('Authentication is required.'),
			403: error('Administrator access is required.'),
			404: error('Realtime paste was not found.'),
			500: common500
		}
	},
	'DELETE /admin/tags/{id}': {
		security: sessionRequired,
		parameters: [id],
		responses: {
			200: ok('MessageResponse', 'Tag deleted.'),
			400: error('Invalid tag id.'),
			401: error('Authentication is required.'),
			403: error('Administrator access is required.'),
			404: error('Tag was not found.'),
			500: common500
		}
	},
	'PUT /admin/syntaxes/{id}': {
		security: sessionRequired,
		parameters: [id],
		requestBody: jsonBody(ref('UpdateSyntaxRequest')),
		responses: {
			200: ok('MessageResponse', 'Syntax updated.'),
			400: error('Invalid syntax id or body.'),
			401: error('Authentication is required.'),
			403: error('Administrator access is required.'),
			404: error('Syntax was not found.'),
			409: error('Syntax name already exists.'),
			413: body413,
			500: common500
		}
	}
}

const manualContracts = {
	'GET /': {
		tags: ['Misc'],
		summary: 'API greeting',
		description: 'Returns a plain-text API greeting.',
		security: publicAccess,
		responses: { 200: text('DoggoPaste REST API greeting.') }
	},
	'GET /health': {
		tags: ['Misc'],
		summary: 'Health check',
		description: 'Reports API and PostgreSQL health.',
		security: publicAccess,
		responses: {
			200: ok('HealthOk', 'API and PostgreSQL are healthy.'),
			503: ok('HealthDegraded', 'PostgreSQL is unavailable.')
		}
	},
	'GET /openapi': {
		tags: ['Misc'],
		summary: 'OpenAPI document',
		description: 'Returns this OpenAPI document as JSON.',
		security: publicAccess,
		responses: {
			200: {
				description: 'OpenAPI JSON document.',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							additionalProperties: true
						}
					}
				}
			}
		}
	},
	'GET /docs': {
		tags: ['Misc'],
		summary: 'Interactive API documentation',
		description: 'Returns the Scalar documentation UI.',
		security: publicAccess,
		responses: {
			200: {
				description: 'Scalar HTML documentation.',
				content: {
					'text/html; charset=UTF-8': { schema: { type: 'string' } }
				}
			}
		}
	},
	'GET /redirect': {
		tags: ['Misc'],
		summary: 'Profile redirect',
		description: 'Redirects to the configured web profile page.',
		security: publicAccess,
		responses: {
			302: {
				description: 'Redirect to the profile page.',
				headers: {
					Location: {
						description: 'Absolute profile URL.',
						required: true,
						schema: { type: 'string', format: 'uri' }
					}
				}
			}
		}
	}
}

const httpMethods = new Set([
	'get',
	'post',
	'put',
	'patch',
	'delete',
	'options',
	'head',
	'trace'
])

function operationKey(method, path) {
	return `${method.toUpperCase()} ${path}`
}

function splitOperationKey(key) {
	const separator = key.indexOf(' ')
	return [key.slice(0, separator).toLowerCase(), key.slice(separator + 1)]
}

function listOperations(spec) {
	const operations = []
	for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
		for (const method of Object.keys(pathItem)) {
			if (httpMethods.has(method))
				operations.push(operationKey(method, path))
		}
	}
	return operations.sort()
}

function assertEqualOperations(actual, expected, label) {
	const actualValue = [...actual].sort()
	const expectedValue = [...expected].sort()
	if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
		throw new Error(
			`${label} route drift. Expected ${JSON.stringify(expectedValue)}, received ${JSON.stringify(actualValue)}`
		)
	}
}

function validateSchema(schema, location) {
	if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
		throw new Error(`Invalid schema at ${location}`)
	}
	if (Object.keys(schema).length === 0) {
		throw new Error(`Empty schema at ${location}`)
	}
	if (schema.type === 'array' && !schema.items) {
		throw new Error(`Array without items at ${location}`)
	}
	if (
		schema.type === 'object' &&
		!schema.properties &&
		schema.additionalProperties === undefined &&
		!schema.oneOf &&
		!schema.anyOf &&
		!schema.allOf
	) {
		throw new Error(`Object without a defined shape at ${location}`)
	}

	if (schema.items) validateSchema(schema.items, `${location}.items`)
	for (const keyword of ['oneOf', 'anyOf', 'allOf']) {
		for (const [index, child] of (schema[keyword] ?? []).entries()) {
			validateSchema(child, `${location}.${keyword}[${index}]`)
		}
	}
	for (const [name, child] of Object.entries(schema.properties ?? {})) {
		validateSchema(child, `${location}.properties.${name}`)
	}
	if (
		schema.additionalProperties &&
		typeof schema.additionalProperties === 'object'
	) {
		validateSchema(
			schema.additionalProperties,
			`${location}.additionalProperties`
		)
	}
	if (schema.if) validateSchema(schema.if, `${location}.if`)
	if (schema.then) validateSchema(schema.then, `${location}.then`)
	if (schema.else) validateSchema(schema.else, `${location}.else`)
}

function validateMediaType(mediaType, location) {
	if (mediaType.schema) validateSchema(mediaType.schema, `${location}.schema`)
}

export function validateOpenApiSpec(spec) {
	assertEqualOperations(
		listOperations(spec),
		[...Object.keys(generatedContracts), ...Object.keys(manualContracts)],
		'Final OpenAPI'
	)

	for (const [name, schema] of Object.entries(
		spec.components?.schemas ?? {}
	)) {
		validateSchema(schema, `components.schemas.${name}`)
	}

	for (const [path, pathItem] of Object.entries(spec.paths)) {
		for (const [method, operation] of Object.entries(pathItem)) {
			if (!httpMethods.has(method)) continue
			const location = `${method.toUpperCase()} ${path}`
			if (operation.responses?.default) {
				throw new Error(`${location} contains a default response`)
			}
			if (
				!operation.responses ||
				Object.keys(operation.responses).length === 0
			) {
				throw new Error(`${location} has no responses`)
			}

			for (const [status, response] of Object.entries(
				operation.responses
			)) {
				if (!/^\d{3}$/u.test(status)) {
					throw new Error(
						`${location} has non-concrete response ${status}`
					)
				}
				for (const [media, mediaType] of Object.entries(
					response.content ?? {}
				)) {
					validateMediaType(
						mediaType,
						`${location}.${status}.${media}`
					)
				}
			}

			for (const [media, mediaType] of Object.entries(
				operation.requestBody?.content ?? {}
			)) {
				validateMediaType(mediaType, `${location}.requestBody.${media}`)
			}
			for (const [index, parameter] of (
				operation.parameters ?? []
			).entries()) {
				if (!parameter.schema) {
					throw new Error(
						`${location} parameter ${index} has no schema`
					)
				}
				validateSchema(
					parameter.schema,
					`${location}.parameters[${index}]`
				)
			}
		}
	}

	const serialized = JSON.stringify(spec)
	if (serialized.includes('passwordHash')) {
		throw new Error('OpenAPI exposes passwordHash')
	}
	for (const pathItem of Object.values(spec.paths)) {
		for (const operation of Object.values(pathItem)) {
			if (!operation || typeof operation !== 'object') continue
			if (
				(operation.parameters ?? []).some(
					(parameter) =>
						parameter.in === 'query' &&
						parameter.name === 'password'
				)
			) {
				throw new Error(
					'OpenAPI accepts a password in the query string'
				)
			}
		}
	}
}

export const expectedOperationKeys = [
	...Object.keys(generatedContracts),
	...Object.keys(manualContracts)
].sort()

export function finalizeDoggoSpec(spec) {
	assertEqualOperations(
		listOperations(spec),
		Object.keys(generatedContracts),
		'Generated Hono'
	)

	for (const [key, contract] of Object.entries(generatedContracts)) {
		const [method, path] = splitOperationKey(key)
		const operation = spec.paths[path][method]
		delete operation.parameters
		delete operation.requestBody
		delete operation.responses
		delete operation.security
		Object.assign(operation, contract)
	}

	for (const [key, operation] of Object.entries(manualContracts)) {
		const [method, path] = splitOperationKey(key)
		spec.paths[path] ??= {}
		spec.paths[path][method] = operation
	}

	spec.components = {
		...(spec.components ?? {}),
		schemas: {
			...(spec.components?.schemas ?? {}),
			...schemas
		},
		securitySchemes: {
			...(spec.components?.securitySchemes ?? {}),
			sessionCookie: {
				type: 'apiKey',
				in: 'cookie',
				name: 'doggopaste.session_token',
				description: 'DoggoPaste Better Auth session cookie over HTTP.'
			},
			secureSessionCookie: {
				type: 'apiKey',
				in: 'cookie',
				name: '__Secure-doggopaste.session_token',
				description: 'DoggoPaste Better Auth session cookie over HTTPS.'
			}
		}
	}
	delete spec.security

	const tags = new Map((spec.tags ?? []).map((tag) => [tag.name, tag]))
	tags.set('Misc', {
		name: 'Misc',
		description: 'API metadata, documentation, and health endpoints.'
	})
	spec.tags = [...tags.values()]

	validateOpenApiSpec(spec)
	return spec
}
