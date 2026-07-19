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

const textFileResponse = (passwordProtected = false) => ({
	description: 'Paste content delivered as a UTF-8 text file.',
	headers: {
		'Content-Disposition': attachmentHeader,
		...(passwordProtected
			? {
					'Cache-Control': {
						description:
							'Prevents storage of password-protected content.',
						required: true,
						schema: { type: 'string', enum: ['no-store'] }
					}
				}
			: {})
	},
	content: {
		'text/plain; charset=utf-8': {
			schema: { type: 'string' }
		}
	}
})

download.get.responses = {
	200: textFileResponse(),
	400: {
		description:
			'A password query parameter was supplied; passwords in URLs are rejected.'
	},
	401: {
		description:
			'The paste requires a password and must be downloaded with POST.'
	},
	404: {
		description: 'The paste is missing, expired, private, or inaccessible.'
	}
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
	200: textFileResponse(true),
	400: {
		description:
			'The JSON body is missing, malformed, or invalid, or the paste does not require a password.'
	},
	403: { description: 'The supplied password is incorrect.' },
	404: {
		description: 'The paste is missing, expired, private, or inaccessible.'
	}
}

await writeFile(openApiPath, `${JSON.stringify(spec, null, '\t')}\n`)
