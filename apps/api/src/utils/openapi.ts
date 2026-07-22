import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { GenerateSpecOptions } from 'hono-openapi'
import { auth } from './index.js'
import { REQUEST_LIMITS } from './request-limits.js'

const cwd = process.cwd()
const path = join(cwd, 'openapi', 'openapi.json')
const doggoSpecUrl = pathToFileURL(path).href
const { default: doggoSpec } = await import(doggoSpecUrl, {
	with: { type: 'json' }
})

type OpenApiRecord = Record<string, unknown>
type OpenApiTag = OpenApiRecord & { name: string }
type OpenApiDocument = {
	openapi?: string
	info?: OpenApiRecord
	servers?: unknown[]
	paths?: Record<string, unknown>
	tags?: OpenApiTag[]
	components?: Record<string, OpenApiRecord>
}

const doggoDocument = doggoSpec as OpenApiDocument

// biome-ignore lint: any is tolerated here
const addPrefixToPaths = (paths: any, prefix: string) => {
	// biome-ignore lint: any is tolerated here
	const result: any = {}

	for (const [routePath, methods] of Object.entries(paths)) {
		const newPath = routePath.startsWith(prefix)
			? routePath
			: `${prefix}${routePath}`

		result[newPath] = methods
	}

	return result
}

// biome-ignore lint: Getting paths type is unnecessary
export const updateTagsInPaths = (paths: any) => {
	for (const path of Object.keys(paths)) {
		for (const method of Object.keys(paths[path])) {
			const operation = paths[path][method]
			if (operation.tags && Array.isArray(operation.tags)) {
				// Replace 'Default' with 'Auth Base'
				operation.tags = operation.tags.map((tag: string) =>
					tag === 'Default' ? 'Auth Base' : tag
				)
			}
		}
	}
}

const {
	components: authComponents,
	openapi: authOpenapi,
	paths: authPaths,
	tags: authTags
} = await auth.api.generateOpenAPISchema()

updateTagsInPaths(authPaths)

const authPathsWithPrefix = addPrefixToPaths(authPaths, '/auth')

const optionalSessionSecurity = [
	{},
	{ sessionCookie: [] },
	{ secureSessionCookie: [] }
]

function isGeneratedEmptyRequestBody(requestBody: unknown): boolean {
	if (!requestBody || typeof requestBody !== 'object') return false

	const content = (
		requestBody as {
			content?: Record<string, { schema?: OpenApiRecord }>
		}
	).content
	if (!content || Object.keys(content).length !== 1) return false

	const schema = content['application/json']?.schema
	if (schema?.type !== 'object') return false
	if (!schema.properties || typeof schema.properties !== 'object')
		return false
	if (Object.keys(schema.properties).length !== 0) return false

	return Object.keys(schema).every((key) =>
		['type', 'properties'].includes(key)
	)
}

function isEmptyRecord(value: unknown): value is OpenApiRecord {
	return (
		value !== null &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		Object.keys(value).length === 0
	)
}

function normalizeGeneratedOpenApiSchemas(value: unknown): void {
	if (Array.isArray(value)) {
		for (const item of value) normalizeGeneratedOpenApiSchemas(item)
		return
	}
	if (!value || typeof value !== 'object') return

	const record = value as OpenApiRecord
	const nullable = record.nullable
	delete record.nullable
	if (nullable === true) {
		if (typeof record.type === 'string') {
			record.type = [record.type, 'null']
		} else if (Array.isArray(record.type)) {
			if (!record.type.includes('null')) record.type.push('null')
		} else {
			const nonNullSchema = { ...record }
			for (const key of Object.keys(record)) delete record[key]
			record.anyOf = [nonNullSchema, { type: 'null' }]
		}
	}
	if (isEmptyRecord(record.additionalProperties)) {
		record.additionalProperties = true
	}
	if (isEmptyRecord(record.propertyNames)) {
		delete record.propertyNames
	}
	if (
		record.type === 'object' &&
		isEmptyRecord(record.properties) &&
		'additionalProperties' in record
	) {
		delete record.properties
	}

	for (const child of Object.values(record)) {
		normalizeGeneratedOpenApiSchemas(child)
	}
}

for (const pathItem of Object.values(authPathsWithPrefix)) {
	for (const operation of Object.values(pathItem)) {
		if (!operation || typeof operation !== 'object') continue

		// Better Auth 1.6 emits bearer auth for every operation even when the
		// bearer plugin is not configured. DoggoPaste authenticates with its
		// HTTP(S) session cookies; an empty alternative keeps public auth routes
		// callable without falsely advertising bearer support.
		operation.security = optionalSessionSecurity

		if (isGeneratedEmptyRequestBody(operation.requestBody)) {
			delete operation.requestBody
		}
		if (!operation.requestBody) continue

		operation.responses ??= {}
		operation.responses['413'] ??= {
			description: `Request body exceeds the ${REQUEST_LIMITS.jsonBodyBytes}-byte limit.`,
			content: {
				'application/json': {
					schema: { $ref: '#/components/schemas/ApiError' }
				}
			}
		}
	}
}

authPathsWithPrefix['/auth/open-api/generate-schema'] = {
	get: {
		tags: ['Auth Base'],
		description: 'Get the Better Auth OpenAPI document.',
		security: [{}],
		responses: {
			200: {
				description: 'Success',
				content: {
					'application/json': {
						schema: { type: 'object', additionalProperties: true }
					}
				}
			}
		}
	}
}
authPathsWithPrefix['/auth/docs'] = {
	get: {
		tags: ['Auth Base'],
		description: 'Get the Better Auth API reference.',
		security: [{}],
		responses: {
			200: {
				description: 'Success',
				content: {
					'text/html': { schema: { type: 'string' } }
				}
			}
		}
	}
}

normalizeGeneratedOpenApiSchemas(authPathsWithPrefix)
normalizeGeneratedOpenApiSchemas(authComponents)

const permissionMapSchema = {
	type: 'object',
	additionalProperties: {
		type: 'array',
		items: { type: 'string' }
	}
}

const adminPermissionBody =
	authPathsWithPrefix['/auth/admin/has-permission']?.post?.requestBody
if (adminPermissionBody) {
	adminPermissionBody.required = true
	const schema = adminPermissionBody.content?.['application/json']?.schema
	if (schema?.properties) {
		schema.properties.userId = { type: 'string' }
		schema.properties.role = { type: 'string' }
		schema.properties.permissions = {
			...(schema.properties.permissions ?? {}),
			...permissionMapSchema
		}
	}
}

const organizationPermissionBody =
	authPathsWithPrefix['/auth/organization/has-permission']?.post?.requestBody
if (organizationPermissionBody) {
	organizationPermissionBody.required = true
	const schema =
		organizationPermissionBody.content?.['application/json']?.schema
	if (schema?.properties) {
		delete schema.properties.permission
		schema.properties.organizationId = { type: 'string' }
		schema.properties.permissions = {
			...(schema.properties.permissions ?? {}),
			...permissionMapSchema
		}
	}
}

const accountInfoResponse =
	authPathsWithPrefix['/auth/account-info']?.get?.responses?.['200']
		?.content?.['application/json']?.schema
if (accountInfoResponse) {
	for (const key of Object.keys(accountInfoResponse)) {
		delete accountInfoResponse[key]
	}
	accountInfoResponse.oneOf = [
		{
			type: 'object',
			additionalProperties: false,
			required: ['user', 'data'],
			properties: {
				user: {
					type: 'object',
					required: ['id', 'emailVerified'],
					properties: {
						id: {
							oneOf: [{ type: 'string' }, { type: 'number' }]
						},
						name: { type: 'string' },
						email: {
							oneOf: [{ type: 'string' }, { type: 'null' }]
						},
						image: { type: 'string' },
						emailVerified: { type: 'boolean' }
					}
				},
				data: {
					type: 'object',
					additionalProperties: true,
					description: 'Provider-specific account data.'
				}
			}
		},
		{ type: 'null' }
	]
}

const invitationResponseSchemas = {
	accept: authPathsWithPrefix['/auth/organization/accept-invitation']?.post
		?.responses?.['200']?.content?.['application/json']?.schema,
	reject: authPathsWithPrefix['/auth/organization/reject-invitation']?.post
		?.responses?.['200']?.content?.['application/json']?.schema
}

if (invitationResponseSchemas.accept) {
	invitationResponseSchemas.accept.properties = {
		invitation: { $ref: '#/components/schemas/Invitation' },
		member: { $ref: '#/components/schemas/Member' }
	}
	invitationResponseSchemas.accept.required = ['invitation', 'member']
}

if (invitationResponseSchemas.reject) {
	invitationResponseSchemas.reject.properties = {
		invitation: {
			oneOf: [
				{ $ref: '#/components/schemas/Invitation' },
				{ type: 'null' }
			]
		},
		member: { type: 'null' }
	}
	invitationResponseSchemas.reject.required = ['invitation', 'member']
}

const sanitizedAuthComponents = {
	...(authComponents as Record<string, OpenApiRecord>)
}
const authSecuritySchemes = {
	...(sanitizedAuthComponents.securitySchemes ?? {})
}
delete authSecuritySchemes.apiKeyCookie
delete authSecuritySchemes.bearerAuth
sanitizedAuthComponents.securitySchemes = authSecuritySchemes

const mergedPaths = {
	...(doggoDocument.paths ?? {}),
	...authPathsWithPrefix
}

function mergeComponents(
	...documents: Array<Record<string, OpenApiRecord> | undefined>
) {
	const merged: Record<string, OpenApiRecord> = {}

	for (const document of documents) {
		for (const [section, values] of Object.entries(document ?? {})) {
			merged[section] = {
				...(merged[section] ?? {}),
				...values
			}
		}
	}

	return merged
}

// biome-ignore lint: any is tolerated here
const mergedTagsMap = new Map<string, any>()

const mergedTags = [
	{ name: 'Default', description: 'Default endpoints for API documentation' },
	{ name: 'Auth Base', description: 'Base endpoints for authentication' },
	...(doggoDocument.tags ?? []),
	// biome-ignore lint: any is tolerated here
	...authTags.filter((t: any) => t.name !== 'Default')
] as OpenApiTag[]

for (const tag of mergedTags) {
	if (!mergedTagsMap.has(tag.name)) {
		mergedTagsMap.set(tag.name, tag)
	}
}

export const openApiSpec = {
	documentation: {
		openapi: doggoDocument.openapi ?? authOpenapi,
		info: {
			...doggoDocument.info,
			title: 'DoggoPaste API',
			version: '0.2.0',
			description: 'Drop your code, let Doggo fetch it!'
		},
		servers: doggoDocument.servers,
		paths: mergedPaths,
		tags: Array.from(mergedTagsMap.values()),
		components: mergeComponents(
			sanitizedAuthComponents,
			doggoDocument.components
		)
	}
} as Partial<GenerateSpecOptions>
