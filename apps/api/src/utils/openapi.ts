import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import type { GenerateSpecOptions } from 'hono-openapi'
import { auth } from './index.js'

const cwd = process.cwd()
const path = join(cwd, 'openapi', 'openapi.json')
const doggoSpecUrl = pathToFileURL(path).href
const { default: doggoSpec } = await import(doggoSpecUrl, {
	with: { type: 'json' }
})

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
	security,
	tags: authTags
} = await auth.api.generateOpenAPISchema()

updateTagsInPaths(authPaths)

const authPathsWithPrefix = addPrefixToPaths(authPaths, '/auth')

const mergedPaths = {
	'/docs': {
		get: {
			tags: ['Misc'],
			description: 'Get the OpenAPI documentation with Scalar UI',
			responses: { 200: { description: 'Success' } }
		}
	},
	'/openapi': {
		get: {
			tags: ['Misc'],
			description: 'Get the OpenAPI documentation as plain JSON',
			responses: { 200: { description: 'Success' } }
		}
	},
	'/health': {
		get: {
			tags: ['Misc'],
			description:
				'Health check to verify API and its services are running',
			responses: { 200: { description: 'Success' } }
		}
	},
	...doggoSpec.paths,
	...authPathsWithPrefix
}

// biome-ignore lint: any is tolerated here
const mergedTagsMap = new Map<string, any>()

for (const tag of [
	{ name: 'Default', description: 'Default endpoints for API documentation' },
	{ name: 'Auth Base', description: 'Base endpoints for authentication' },
	...(doggoSpec.tags ?? []),
	// biome-ignore lint: any is tolerated here
	...authTags.filter((t: any) => t.name !== 'Default')
]) {
	if (!mergedTagsMap.has(tag.name)) {
		mergedTagsMap.set(tag.name, tag)
	}
}

export const openApiSpec = {
	documentation: {
		openapi: doggoSpec.openapi ?? authOpenapi,
		info: {
			...doggoSpec.info,
			title: 'DoggoPaste API',
			version: '0.2.0',
			description: 'Drop your code, let Doggo fetch it!'
		},
		servers: [
			{
				url: `${process.env.APP_URL}/api`,
				description: 'REST API Server Base'
			}
		],
		paths: mergedPaths,
		tags: Array.from(mergedTagsMap.values()),
		components: authComponents,
		security
	}
} as Partial<GenerateSpecOptions>
