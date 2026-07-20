import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { glob } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

const apiRoot = fileURLToPath(new URL('..', import.meta.url))
const migrationsFolder = fileURLToPath(new URL('../drizzle', import.meta.url))
const controlDatabaseName = 'doggopaste_test_control'
const generatedDatabasePattern = /^doggopaste_test_[0-9]+_[a-f0-9]+$/u
const sensitiveValues = new Set()
const { Client, Pool } = pg

function safeDecode(value) {
	try {
		return decodeURIComponent(value)
	} catch {
		return value
	}
}

function rememberCredentials(databaseUrl) {
	for (const value of [
		databaseUrl.username,
		databaseUrl.password,
		safeDecode(databaseUrl.username),
		safeDecode(databaseUrl.password)
	]) {
		if (value) sensitiveValues.add(value)
	}
}

function sanitizeError(error) {
	let message = error instanceof Error ? error.message : 'Unknown error'
	message = message.replace(
		/postgres(?:ql)?:\/\/[^\s]+/giu,
		'postgresql://[redacted]'
	)
	for (const value of sensitiveValues) {
		message = message.replaceAll(value, '[redacted]')
	}
	return message
}

function readControlDatabaseUrl() {
	if (process.env.NODE_ENV !== 'test') {
		throw new Error('Refusing to run database tests without NODE_ENV=test')
	}

	const value = process.env.TEST_DATABASE_URL
	if (!value) {
		throw new Error('TEST_DATABASE_URL is required')
	}

	let databaseUrl
	try {
		databaseUrl = new URL(value)
	} catch {
		throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL URL')
	}

	rememberCredentials(databaseUrl)

	if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
		throw new Error('TEST_DATABASE_URL must use PostgreSQL')
	}

	const databaseName = safeDecode(databaseUrl.pathname.slice(1))
	if (databaseName !== controlDatabaseName) {
		throw new Error(`TEST_DATABASE_URL must target ${controlDatabaseName}`)
	}

	if (!databaseUrl.hostname) {
		throw new Error('TEST_DATABASE_URL must contain a hostname')
	}

	return databaseUrl
}

function quoteIdentifier(identifier) {
	if (!generatedDatabasePattern.test(identifier)) {
		throw new Error('Refusing to use an unsafe generated database name')
	}
	return `"${identifier}"`
}

async function executeControlQuery(controlUrl, query) {
	const client = new Client({ connectionString: controlUrl.toString() })
	await client.connect()
	try {
		await client.query(query)
	} finally {
		await client.end()
	}
}

async function applyMigrations(databaseUrl) {
	const pool = new Pool({ connectionString: databaseUrl.toString() })
	try {
		await migrate(drizzle(pool), { migrationsFolder })
	} finally {
		await pool.end()
	}
}

async function findTestFiles() {
	const files = []
	for await (const file of glob('__tests__/**/*.test.ts', {
		cwd: apiRoot
	})) {
		files.push(file)
	}
	files.sort()

	if (files.length === 0) {
		throw new Error('No test files found')
	}
	return files
}

async function runNodeTests(databaseUrl, watch) {
	const testFiles = await findTestFiles()
	const nodeArguments = ['--import', 'tsx', '--test']
	if (watch) nodeArguments.push('--watch')
	nodeArguments.push(...testFiles)

	const childEnvironment = {
		...process.env,
		DATABASE_URL: databaseUrl.toString(),
		DOGGOPASTE_TEST_DATABASE_NAME: safeDecode(databaseUrl.pathname.slice(1))
	}
	delete childEnvironment.TEST_DATABASE_URL

	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, nodeArguments, {
			cwd: apiRoot,
			env: childEnvironment,
			stdio: 'inherit'
		})
		const forwardSignal = (signal) => child.kill(signal)
		const onInterrupt = () => forwardSignal('SIGINT')
		const onTerminate = () => forwardSignal('SIGTERM')

		process.once('SIGINT', onInterrupt)
		process.once('SIGTERM', onTerminate)

		const removeSignalHandlers = () => {
			process.off('SIGINT', onInterrupt)
			process.off('SIGTERM', onTerminate)
		}

		child.once('error', (error) => {
			removeSignalHandlers()
			reject(error)
		})
		child.once('exit', (code, signal) => {
			removeSignalHandlers()
			if (typeof code === 'number') {
				resolve(code)
				return
			}
			resolve(signal === 'SIGINT' ? 130 : 1)
		})
	})
}

async function main() {
	const arguments_ = process.argv.slice(2)
	if (arguments_.some((argument) => argument !== '--watch')) {
		throw new Error('Unsupported test runner argument')
	}
	const watch = arguments_.includes('--watch')
	const controlUrl = readControlDatabaseUrl()
	const databaseName = `doggopaste_test_${process.pid}_${randomBytes(8).toString('hex')}`
	const databaseIdentifier = quoteIdentifier(databaseName)
	const databaseUrl = new URL(controlUrl)
	databaseUrl.pathname = `/${databaseName}`
	let databaseCreated = false
	let result = 1
	let primaryError

	try {
		await executeControlQuery(
			controlUrl,
			`CREATE DATABASE ${databaseIdentifier}`
		)
		databaseCreated = true
		await applyMigrations(databaseUrl)
		result = await runNodeTests(databaseUrl, watch)
	} catch (error) {
		primaryError = error
	} finally {
		if (databaseCreated) {
			try {
				await executeControlQuery(
					controlUrl,
					`DROP DATABASE IF EXISTS ${databaseIdentifier} WITH (FORCE)`
				)
			} catch (cleanupError) {
				if (!primaryError) {
					primaryError = cleanupError
				} else {
					console.error(
						`Test database cleanup failed: ${sanitizeError(cleanupError)}`
					)
				}
			}
		}
	}

	if (primaryError) throw primaryError
	return result
}

try {
	process.exitCode = await main()
} catch (error) {
	console.error(`Test runner failed: ${sanitizeError(error)}`)
	process.exitCode = 1
}
