import { strictEqual } from 'node:assert'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { eq } from 'drizzle-orm'
import { db } from '../../src/db/index.js'
import {
	realTimePastesTable,
	syntaxesTable
} from '../../src/db/schema.js'
import {
	loadRealtimeSocketSnapshot,
	saveRealtimeContent,
	saveRealtimeMetadata
} from '../../src/utils/realtime-persistence.js'
import { prepareDb } from '../test-utils.js'

test('realtime persistence applies one CAS winner per revision', async () => {
	await prepareDb()
	const slug = `cas-${randomUUID().replaceAll('-', '')}`
	await db.insert(realTimePastesTable).values({
		slug,
		title: slug,
		content: ''
	})

	try {
		const initial = await loadRealtimeSocketSnapshot(slug)
		strictEqual(initial?.revision, 0)

		const results = await Promise.all([
			saveRealtimeContent(slug, 'first', 0),
			saveRealtimeContent(slug, 'second', 0)
		])
		strictEqual(
			results.filter((result) => result.status === 'success').length,
			1
		)
		strictEqual(
			results.filter((result) => result.status === 'revision_conflict')
				.length,
			1
		)

		const winner = await loadRealtimeSocketSnapshot(slug)
		strictEqual(winner?.revision, 1)
		strictEqual(['first', 'second'].includes(winner?.content ?? ''), true)

		const [plaintext] = await db
			.select({ name: syntaxesTable.name })
			.from(syntaxesTable)
			.where(eq(syntaxesTable.name, 'Plaintext'))
		strictEqual(plaintext?.name, 'Plaintext')

		const metadata = await saveRealtimeMetadata(
			slug,
			'Renamed',
			'Plaintext',
			1
		)
		strictEqual(metadata.status, 'success')
		if (metadata.status === 'success') strictEqual(metadata.revision, 2)

		const stale = await saveRealtimeContent(slug, 'stale snapshot', 1)
		strictEqual(stale.status, 'revision_conflict')
		const finalSnapshot = await loadRealtimeSocketSnapshot(slug)
		strictEqual(finalSnapshot?.revision, 2)
		strictEqual(finalSnapshot?.content, winner?.content)
		strictEqual(finalSnapshot?.title, 'Renamed')
	} finally {
		await db
			.delete(realTimePastesTable)
			.where(eq(realTimePastesTable.slug, slug))
	}
})
