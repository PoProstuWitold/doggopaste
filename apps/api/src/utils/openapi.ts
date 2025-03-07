import type { OpenApiSpecsOptions } from 'hono-openapi'
import { auth } from './index.js'

const { components, openapi, paths, security, tags } =
	await auth.api.generateOpenAPISchema()

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

updateTagsInPaths(paths)

export const openApiSpec = {
	documentation: {
		paths: {
			'/docs': {
				get: {
					tags: ['Default'],
					description: 'Get the OpenAPI documentation with Scalar UI',
					responses: {
						200: {
							description: 'Success'
						}
					}
				}
			},
			'/openapi': {
				get: {
					tags: ['Default'],
					description: 'Get the OpenAPI documentation as plain JSON',
					responses: {
						200: {
							description: 'Success'
						}
					}
				}
			},
			...paths
		},
		info: {
			title: 'Hono & Next.js',
			version: '0.1.0',
			description: 'API Reference for Hono & Next.js fullstack template',
			contact: {
				name: 'Witold Zawada',
				email: 'witoldzawada.dev@gmail.com',
				url: 'https://witoldzawada.dev'
			},
			license: {
				name: 'MIT',
				url: 'https://opensource.org/licenses/MIT'
			}
		},
		servers: [
			{
				url: 'http://localhost:3000/api',
				description: 'Local Server Base'
			},
			{
				url: 'http://localhost:3000/api/auth',
				description: 'Auth routes'
			}
		],
		tags: [
			{
				name: 'Default',
				description: 'Default endpoints for API documentation'
			},
			{
				name: 'Auth Base',
				description: 'Base endpoints for authentication'
			},
			...tags.filter((tag) => tag.name !== 'Default')
		],
		components,
		security,
		openapi
	}
} as OpenApiSpecsOptions
