// biome-ignore-all lint: test files
import { deepStrictEqual, strictEqual } from 'node:assert'
import test from 'node:test'
import { Hono } from 'hono'
import { errorHandler } from '../../src/middlewares/error-handler.js'
import { createHealthHandler } from '../../src/utils/health.js'
import { getTestApp, prepareDb } from '../test-utils.js'

test(
	'MISC: /api',
	{
		concurrency: true
	},
	async (t) => {
		await prepareDb()
		const app = getTestApp()

		await t.test('GET /', async () => {
			const res = await app.request('/api')
			const text = await res.text()

			strictEqual(text, 'DoggoPaste REST API')
			strictEqual(res.status, 200)
		})

		await t.test('GET /health', async () => {
			const res = await app.request('/api/health')
			const json: any = await res.json()

			strictEqual(json.status, 'ok')
			strictEqual(res.status, 200)
		})

		await t.test(
			'GET /health hides database error details when degraded',
			async () => {
				const isolatedApp = new Hono()
				const databaseError = new Error(
					'connection to postgres.internal.example failed'
				)
				const logged: unknown[][] = []
				isolatedApp.get(
					'/health',
					createHealthHandler(
						async () => {
							throw databaseError
						},
						(...args: unknown[]) => logged.push(args)
					)
				)

				const res = await isolatedApp.request('/health')
				const json: any = await res.json()

				strictEqual(res.status, 503)
				strictEqual(json.status, 'degraded')
				strictEqual(json.services.postgres.connected, false)
				strictEqual(json.services.postgres.error, 'unavailable')
				strictEqual(
					JSON.stringify(json).includes('postgres.internal.example'),
					false
				)
				strictEqual(
					logged.some((args) => args.includes(databaseError)),
					true
				)
			}
		)

		await t.test(
			'unknown server errors are logged without exposing details',
			async () => {
				const isolatedApp = new Hono()
				const internalError = new Error(
					'database relation internal_only does not exist'
				)
				isolatedApp.get('/failure', () => {
					throw internalError
				})
				isolatedApp.onError(errorHandler)

				const logged: unknown[][] = []
				const originalConsoleError = console.error
				console.error = (...args: unknown[]) => logged.push(args)

				try {
					const res = await isolatedApp.request('/failure')
					const json: any = await res.json()

					strictEqual(res.status, 500)
					strictEqual(json.statusCode, 500)
					strictEqual(json.name, 'Internal Server Error')
					strictEqual(json.message, 'Internal Server Error')
					strictEqual(JSON.stringify(json).includes('internal_only'), false)
					strictEqual(logged.some((args) => args.includes(internalError)), true)
				} finally {
					console.error = originalConsoleError
				}
			}
		)

		await t.test('GET /openapi', async () => {
			const res = await app.request('/api/openapi')
			const spec: any = await res.json()
			const download = spec.paths['/pastes/{slug}/download']

			strictEqual(res.status, 200)
			strictEqual(
				download.post.requestBody.content['application/json'].schema.$ref,
				'#/components/schemas/DownloadPasswordRequest'
			)
			strictEqual(
				spec.components.schemas.DownloadPasswordRequest.properties.password
					.type,
				'string'
			)
			strictEqual(download.post.requestBody.required, true)
			strictEqual(
				download.get.responses['200'].content[
					'text/plain; charset=utf-8'
				].schema.type,
				'string'
			)
			strictEqual(
				download.get.responses['200'].headers['Content-Disposition']
					.required,
				true
			)
			strictEqual(download.get.responses['400'].description.length > 0, true)
			strictEqual(download.get.responses['401'].description.length > 0, true)
			strictEqual(download.get.responses['404'].description.length > 0, true)
			strictEqual(
				download.post.responses['200'].headers['Cache-Control'].schema
					.const,
				'no-store'
			)
			for (const [method, statuses] of [
				['get', ['200', '400', '401', '404']],
				['post', ['200', '400', '403', '404']]
			] as const) {
				for (const status of statuses) {
					strictEqual(
						download[method].responses[status].headers['Cache-Control']
							.schema.const,
						'no-store'
					)
				}
			}
			strictEqual(download.post.responses['400'].description.length > 0, true)
			strictEqual(download.post.responses['403'].description.length > 0, true)
			strictEqual(download.post.responses['404'].description.length > 0, true)

			const authSecuritySchemes = spec.components.securitySchemes
			strictEqual('bearerAuth' in authSecuritySchemes, false)
			strictEqual('apiKeyCookie' in authSecuritySchemes, false)
			strictEqual('security' in spec, false)
			for (const path of [
				'/auth/get-session',
				'/auth/sign-out',
				'/auth/revoke-sessions',
				'/auth/revoke-other-sessions'
			]) {
				strictEqual(spec.paths[path].post.requestBody, undefined)
			}
			for (const [path, pathItem] of Object.entries(spec.paths) as [
				string,
				Record<string, any>
			][]) {
				if (!path.startsWith('/auth/')) continue
				for (const [method, operation] of Object.entries(pathItem)) {
					if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
						continue
					}
					const publicDocumentationPaths = [
						'/auth/open-api/generate-schema',
						'/auth/docs'
					]
					deepStrictEqual(
						operation.security,
						publicDocumentationPaths.includes(path)
							? [{}]
							: [
									{},
									{ sessionCookie: [] },
									{ secureSessionCookie: [] }
								]
					)
					const schema =
						operation.requestBody?.content?.['application/json']?.schema
					const isGeneratedEmptyBody =
						schema?.type === 'object' &&
						Object.keys(schema.properties ?? {}).length === 0 &&
						Object.keys(schema).every((key) =>
							['type', 'properties'].includes(key)
						)
					strictEqual(
						isGeneratedEmptyBody,
						false,
						`${path} contains a generated empty request body`
					)
					if (operation.requestBody) {
						strictEqual(operation.responses['413'] !== undefined, true)
					}
				}
			}

			const adminPermissions =
				spec.paths['/auth/admin/has-permission'].post.requestBody.content[
					'application/json'
				].schema.properties.permissions
			deepStrictEqual(adminPermissions.additionalProperties, {
				type: 'array',
				items: { type: 'string' }
			})

			const organizationPermissionSchema =
				spec.paths['/auth/organization/has-permission'].post.requestBody
					.content['application/json'].schema
			strictEqual(
				organizationPermissionSchema.properties.permission,
				undefined
			)
			strictEqual(
				organizationPermissionSchema.properties.organizationId.type,
				'string'
			)
			deepStrictEqual(
				organizationPermissionSchema.properties.permissions
					.additionalProperties,
				{ type: 'array', items: { type: 'string' } }
			)

			const acceptInvitation =
				spec.paths['/auth/organization/accept-invitation'].post.responses[200]
					.content['application/json'].schema
			strictEqual(
				acceptInvitation.properties.invitation.$ref,
				'#/components/schemas/Invitation'
			)
			strictEqual(
				acceptInvitation.properties.member.$ref,
				'#/components/schemas/Member'
			)
			deepStrictEqual(acceptInvitation.required, ['invitation', 'member'])

			const rejectInvitation =
				spec.paths['/auth/organization/reject-invitation'].post.responses[200]
					.content['application/json'].schema
			deepStrictEqual(rejectInvitation.properties.invitation.oneOf, [
				{ $ref: '#/components/schemas/Invitation' },
				{ type: 'null' }
			])
			deepStrictEqual(rejectInvitation.properties.member, { type: 'null' })
			strictEqual(
				spec.paths['/auth/open-api/generate-schema'].get.responses[200]
					.content['application/json'].schema.additionalProperties,
				true
			)
			strictEqual(
				spec.paths['/auth/docs'].get.responses[200].content['text/html']
					.schema.type,
				'string'
			)
			strictEqual(JSON.stringify(spec).includes('"nullable":'), false)

			const unspecifiedSchemas: string[] = []
			const inspectSchema = (value: unknown, path: string): void => {
				if (!value || typeof value !== 'object') return
				if (Array.isArray(value)) {
					value.forEach((item, index) =>
						inspectSchema(item, `${path}/${index}`)
					)
					return
				}

				const schema = value as Record<string, unknown>
				if (Object.keys(schema).length === 0) {
					unspecifiedSchemas.push(path)
					return
				}
				if (
					schema.type === 'object' &&
					!schema.properties &&
					!('additionalProperties' in schema) &&
					!schema.allOf &&
					!schema.anyOf &&
					!schema.oneOf &&
					!schema.$ref
				) {
					unspecifiedSchemas.push(path)
				}

				for (const [key, child] of Object.entries(schema)) {
					inspectSchema(child, `${path}/${key}`)
				}
			}

			for (const [path, pathItem] of Object.entries(spec.paths)) {
				for (const [method, operation] of Object.entries(
					pathItem as Record<string, any>
				)) {
					if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
						continue
					}
					const schemas = [
						operation.requestBody?.content?.['application/json']?.schema,
						...Object.values(operation.responses ?? {}).flatMap(
							(response: any) =>
								Object.values(response.content ?? {}).map(
									(content: any) => content.schema
								)
						)
					]
					schemas.forEach((schema, index) => {
						if (schema) inspectSchema(schema, `${path}/${method}/${index}`)
					})
				}
			}
			for (const [name, schema] of Object.entries(
				spec.components.schemas
			)) {
				inspectSchema(schema, `components/${name}`)
			}
			deepStrictEqual(unspecifiedSchemas, [])
		})

		await t.test('GET /api/docs', async () => {
			const res = await app.request('/api/docs')

			strictEqual(res.status, 200)
		})
	}
)
