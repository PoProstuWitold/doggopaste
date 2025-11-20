import { defineConfig } from '@rcmade/hono-docs'

export default defineConfig({
	tsConfigPath: './tsconfig.json',
	openApi: {
		openapi: '3.2.0',
		info: {
			title: 'DoggoPaste',
			version: '0.2.0',
			description: 'Drop your code, let Doggo fetch it!',
			license: {
				name: 'MIT',
				url: 'https://opensource.org/licenses/MIT'
			}
		}
	},
	outputs: {
		openApiJson: './openapi/openapi.json'
	},
	apis: [
		{
			name: 'Static Pastes',
			apiPrefix: '/pastes',
			appTypePath: 'src/routes/pastes.ts',
			api: [
				{
					api: '/',
					method: 'post',
					summary: '/',
					description:
						'Creates a new static paste with the provided content and metadata.'
				},
				{
					api: '/',
					method: 'get',
					summary: '/',
					description:
						'Retrieves a list of static pastes with pagination support.'
				},
				{
					api: '/{slug}',
					method: 'get',
					summary: '/{slug}',
					description:
						'Fetches the details of a specific static paste identified by its slug.'
				},
				{
					api: '/{slug}',
					method: 'put',
					summary: '/{slug}',
					description:
						'Updates the content or metadata of a specific static paste identified by its slug.'
				},
				{
					api: '/{slug}',
					method: 'delete',
					summary: '/{slug}',
					description:
						'Deletes a specific static paste identified by its slug.'
				},
				{
					api: '/{slug}/download',
					method: 'get',
					summary: '/{slug}/download',
					description:
						'Allows users to download the content of a specific static paste as a file.'
				}
			]
		},
		{
			name: 'Realtime Pastes',
			apiPrefix: '/pastes-realtime',
			appTypePath: 'src/routes/pastes-realtime.ts',
			api: [
				{
					api: '/{slug}',
					method: 'post',
					summary: '/{slug}',
					description:
						'Creates a new realtime paste or retrieves an existing one based on the provided slug.'
				},
				{
					api: '/{slug}',
					method: 'get',
					summary: '/{slug}',
					description:
						'Fetches the details of a specific realtime paste identified by its slug.'
				},
				{
					api: '/{slug}/download',
					method: 'get',
					summary: '/{slug}/download',
					description:
						'Allows users to download the content of a specific realtime paste as a file.'
				}
			]
		},
		{
			name: 'Folders',
			apiPrefix: '/folders',
			appTypePath: 'src/routes/folders.ts',
			api: [
				{
					api: '/',
					method: 'post',
					summary: '/',
					description: 'Creates (or reuses) a folder (root or nested)'
				},
				{
					api: '/f/{id}',
					method: 'get',
					summary: '/{id}',
					description: 'Retrieves a specific folder by id'
				},
				{
					api: '/',
					method: 'get',
					summary: '/',
					description: `Lists user's folders; supports ?parentId=... to list children of a given parent`
				},
				{
					api: '/all',
					method: 'get',
					summary: '/all',
					description: `Lists all user's folders (flat)`
				},
				{
					api: '/{id}',
					method: 'patch',
					summary: '/{id}',
					description: 'Renames a folder'
				},
				{
					api: '/{id}',
					method: 'delete',
					summary: '/{id}',
					description: 'Deletes a folder'
				}
			]
		},
		{
			name: 'User',
			apiPrefix: '/user',
			appTypePath: 'src/routes/user.ts',
			api: [
				{
					api: '/pastes',
					method: 'get',
					summary: '/pastes',
					description:
						'Retrieves a list of public pastes created by specific user. If user that makes the request is authenticated and requests their own pastes, all their pastes are returned.'
				},
				{
					api: '/name/{name}',
					method: 'get',
					summary: '/name/{name}',
					description:
						'Checks if user with given name exists and returns basic info about them.'
				}
			]
		}
	]
})
