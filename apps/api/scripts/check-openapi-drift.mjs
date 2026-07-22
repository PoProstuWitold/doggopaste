import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runGenerate } from '@rcmade/hono-docs'
import { finalizeOpenApiFile } from './finalize-openapi.mjs'

const apiRoot = fileURLToPath(new URL('..', import.meta.url))
const committedPath = fileURLToPath(
	new URL('../openapi/openapi.json', import.meta.url)
)

function canonicalize(value) {
	if (Array.isArray(value)) return value.map(canonicalize)
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.keys(value)
				.sort()
				.map((key) => [key, canonicalize(value[key])])
		)
	}
	return value
}

function digest(value) {
	return createHash('sha256')
		.update(JSON.stringify(canonicalize(value)))
		.digest('hex')
}

export async function checkOpenApiDrift() {
	const temporaryDirectory = await mkdtemp(
		join(tmpdir(), 'doggopaste-openapi-')
	)
	const generatedPath = join(temporaryDirectory, 'openapi.json')
	const previousOutput = process.env.DOGGOPASTE_OPENAPI_OUTPUT
	const previousWorkingDirectory = process.cwd()

	try {
		process.env.DOGGOPASTE_OPENAPI_OUTPUT = relative(apiRoot, generatedPath)
		process.chdir(apiRoot)
		await runGenerate('./hono-docs.ts')
		await finalizeOpenApiFile(generatedPath)

		const committed = JSON.parse(await readFile(committedPath, 'utf8'))
		const generated = JSON.parse(await readFile(generatedPath, 'utf8'))
		if (digest(committed) !== digest(generated)) {
			throw new Error(
				'OpenAPI drift detected. Run `turbo run docs --filter=api` and review the generated document.'
			)
		}
	} finally {
		process.chdir(previousWorkingDirectory)
		if (previousOutput === undefined) {
			delete process.env.DOGGOPASTE_OPENAPI_OUTPUT
		} else {
			process.env.DOGGOPASTE_OPENAPI_OUTPUT = previousOutput
		}
		await rm(temporaryDirectory, { recursive: true, force: true })
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await checkOpenApiDrift()
}
