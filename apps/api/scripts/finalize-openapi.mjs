import { readFile, writeFile } from 'node:fs/promises'

const openApiPath = new URL('../openapi/openapi.json', import.meta.url)
const spec = JSON.parse(await readFile(openApiPath, 'utf8'))
const download = spec.paths?.['/pastes/{slug}/download']

if (!download?.get || !download.post) {
	throw new Error('Generated OpenAPI is missing static paste download routes')
}

const attachmentHeader = {
	description:
		'Attachment filename derived from the sanitized paste title and syntax extension.',
	required: true,
	schema: {
		type: 'string',
		example: 'attachment; filename="example.txt"'
	}
}

const noStoreHeader = {
	description: 'Prevents storage of static paste download responses.',
	required: true,
	schema: { type: 'string', enum: ['no-store'] }
}

const errorResponse = (description) => ({
	description,
	headers: {
		'Cache-Control': noStoreHeader
	}
})

const textFileResponse = () => ({
	description: 'Paste content delivered as a UTF-8 text file.',
	headers: {
		'Content-Disposition': attachmentHeader,
		'Cache-Control': noStoreHeader
	},
	content: {
		'text/plain; charset=utf-8': {
			schema: { type: 'string' }
		}
	}
})

download.get.responses = {
	200: textFileResponse(),
	400: errorResponse(
		'A password query parameter was supplied; passwords in URLs are rejected.'
	),
	401: errorResponse(
		'The paste requires a password and must be downloaded with POST.'
	),
	404: errorResponse(
		'The paste is missing, expired, private, or inaccessible.'
	)
}

download.post.requestBody = {
	required: true,
	content: {
		'application/json': {
			schema: {
				type: 'object',
				required: ['password'],
				properties: {
					password: {
						type: 'string',
						minLength: 1,
						pattern: '\\S',
						description:
							'Non-empty password; it is never accepted in the URL.'
					}
				}
			}
		}
	}
}

download.post.responses = {
	200: textFileResponse(),
	400: errorResponse(
		'The JSON body is missing, malformed, or invalid, or the paste does not require a password.'
	),
	403: errorResponse('The supplied password is incorrect.'),
	404: errorResponse(
		'The paste is missing, expired, private, or inaccessible.'
	)
}

await writeFile(openApiPath, `${JSON.stringify(spec, null, '\t')}\n`)
