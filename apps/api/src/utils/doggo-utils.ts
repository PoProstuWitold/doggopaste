import { sql } from 'drizzle-orm'
import { generate } from 'random-words'
import type { db } from '../db/index.js'

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export class DoggoUtils {
	public static async generateSlug(): Promise<string> {
		const slug = generate({
			exactly: 1,
			wordsPerString: 2,
			separator: '-'
		})[0]

		return slug
	}

	public static async calculateExpirationDate(
		expiration: string
	): Promise<Date | null> {
		const now = new Date()
		switch (expiration) {
			case '10m':
				return new Date(now.getTime() + 10 * 60 * 1000)
			case '1h':
				return new Date(now.getTime() + 60 * 60 * 1000)
			case '1d':
				return new Date(now.getTime() + 24 * 60 * 60 * 1000)
			case '1w':
				return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
			case '2w':
				return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
			case 'burn_after_read':
				return new Date(now.getTime() + 24 * 60 * 60 * 1000)
			default: // also includes 'never'
				return null
		}
	}

	public static sanitizeFileName(title: string): string {
		const sanitized = title
			.replace(/[^\w\s.-]/g, '')
			.trim()
			.replace(/\s+/g, '_')
			.slice(0, 100)
			.replace(/^\.+|\.+$/g, '')

		return sanitized || 'paste'
	}

	/**
	 * Serializes transactions which mutate the folder/paste/tag graph. A single
	 * lock order prevents folder/paste deadlocks and keeps eager orphan cleanup
	 * from racing a new tag link.
	 */
	public static async acquirePasteMutationLock(tx: DatabaseTransaction) {
		await tx.execute(sql`SELECT pg_advisory_xact_lock(1146572623)`)
	}

	public static async removeUnusedTags(tx: DatabaseTransaction) {
		await tx.execute(sql`
			DELETE FROM tags
			WHERE NOT EXISTS (
				SELECT 1 FROM paste_tags WHERE tags.id = paste_tags.tag_id
			)
		`)
	}
}
