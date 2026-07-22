// biome-ignore-all lint: test files
import { deepStrictEqual, strictEqual } from 'node:assert'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'
import { db } from '../../src/db/index.js'

type NameRow = { name: string }
type ColumnRow = {
	columnDefault: string | null
	isNullable: 'YES' | 'NO'
}

const expectedTables = [
	'accounts',
	'folders',
	'invitations',
	'members',
	'organizations',
	'paste_tags',
	'pastes',
	'realtime_pastes',
	'sessions',
	'syntaxes',
	'tags',
	'users',
	'verifications'
]
const expectedEnums = ['category', 'expiration', 'visibility']
const expectedConstraints = [
	'folders_id_user_uc',
	'folders_parent_user_fk',
	'pastes_folder_requires_user_chk',
	'pastes_folder_user_fk',
	'pastes_private_requires_user_chk',
	'pastes_slug_unique',
	'realtime_pastes_slug_unique'
]
const expectedIndexes = [
	'accounts_user_id_idx',
	'folders_parent_folder_id_idx',
	'folders_root_name_uq',
	'folders_sibling_name_uq',
	'folders_tree_idx',
	'invitations_email_idx',
	'invitations_inviter_id_idx',
	'invitations_organization_id_idx',
	'members_organization_id_idx',
	'members_user_id_idx',
	'paste_tags_paste_tag_uq',
	'paste_tags_tag_id_idx',
	'pastes_folder_user_updated_idx',
	'pastes_public_updated_idx',
	'pastes_user_updated_idx',
	'sessions_user_id_idx',
	'verifications_identifier_idx'
]

function missingNames(expected: string[], rows: NameRow[]) {
	const present = new Set(rows.map((row) => row.name))
	return expected.filter((name) => !present.has(name))
}

test('committed migrations build the database from scratch', async () => {
	const journalPath = fileURLToPath(
		new URL('../../drizzle/meta/_journal.json', import.meta.url)
	)
	const migrationsPath = fileURLToPath(
		new URL('../../drizzle', import.meta.url)
	)
	const journal = JSON.parse(await readFile(journalPath, 'utf8')) as {
		entries?: unknown
	}
	if (!Array.isArray(journal.entries)) {
		throw new Error('Drizzle migration journal has no entries array')
	}
	const migrationFiles = (await readdir(migrationsPath)).filter((file) =>
		file.endsWith('.sql')
	)
	strictEqual(journal.entries.length, migrationFiles.length)

	const [
		migrationResult,
		tableResult,
		enumResult,
		constraintResult,
		indexResult,
		revisionColumnResult
	] = await Promise.all([
			db.execute<{ count: number }>(sql`
				SELECT count(*)::integer AS count
				FROM drizzle.__drizzle_migrations
			`),
			db.execute<NameRow>(sql`
				SELECT tablename AS name
				FROM pg_catalog.pg_tables
				WHERE schemaname = 'public'
			`),
			db.execute<NameRow>(sql`
				SELECT type.typname AS name
				FROM pg_catalog.pg_type AS type
				INNER JOIN pg_catalog.pg_namespace AS namespace
					ON namespace.oid = type.typnamespace
				WHERE namespace.nspname = 'public' AND type.typtype = 'e'
			`),
			db.execute<NameRow>(sql`
				SELECT conname AS name
				FROM pg_catalog.pg_constraint
				WHERE connamespace = 'public'::regnamespace
			`),
			db.execute<NameRow>(sql`
				SELECT indexname AS name
				FROM pg_catalog.pg_indexes
				WHERE schemaname = 'public'
			`),
			db.execute<ColumnRow>(sql`
				SELECT
					column_default AS "columnDefault",
					is_nullable AS "isNullable"
				FROM information_schema.columns
				WHERE
					table_schema = 'public'
					AND table_name = 'realtime_pastes'
					AND column_name = 'revision'
			`)
		])

	strictEqual(
		Number(migrationResult.rows[0]?.count),
		journal.entries.length
	)
	deepStrictEqual(missingNames(expectedTables, tableResult.rows), [])
	deepStrictEqual(missingNames(expectedEnums, enumResult.rows), [])
	deepStrictEqual(
		missingNames(expectedConstraints, constraintResult.rows),
		[]
	)
	deepStrictEqual(missingNames(expectedIndexes, indexResult.rows), [])
	deepStrictEqual(revisionColumnResult.rows, [
		{ columnDefault: '0', isNullable: 'NO' }
	])
})
