import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { finalizeDoggoSpec } from './openapi-contract.mjs'

const defaultOpenApiPath = fileURLToPath(
	new URL('../openapi/openapi.json', import.meta.url)
)

export async function finalizeOpenApiFile(path = defaultOpenApiPath) {
	const spec = JSON.parse(await readFile(path, 'utf8'))
	finalizeDoggoSpec(spec)
	await writeFile(path, `${JSON.stringify(spec, null, '\t')}\n`)
	return spec
}

const entryPoint = process.argv[1] ? resolve(process.argv[1]) : null
if (entryPoint === fileURLToPath(import.meta.url)) {
	await finalizeOpenApiFile(process.argv[2])
}
