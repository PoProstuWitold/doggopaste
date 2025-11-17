// biome-ignore-all lint: test files
import { strictEqual } from 'node:assert'
import test from 'node:test'
import { DoggoUtils } from '../../src/utils/doggo-utils.js'

test(
	'DoggoUtils',
	{
		concurrency: true
	},
	async (t) => {
		await t.test('generateSlug()', async () => {
			const randomSlug = await DoggoUtils.generateSlug()

			// slug format string1-string2
			strictEqual(/^[a-z]+-[a-z]+$/.test(randomSlug), true)
		})

		await t.test(`calculateExpirationDate('10m')`, async () => {
			const expiration = await DoggoUtils.calculateExpirationDate('10m')
			const now = new Date()
			strictEqual(
				expiration !== null &&
					expiration.getTime() - now.getTime() <= 10 * 60 * 1000,
				true
			)
		})

		await t.test(`sanitizeFileName(unsanitized)`, async () => {
			const unsanitized = 'My *Awesome* File: Name?.txt'
			const sanitized = await DoggoUtils.sanitizeFileName(unsanitized)
			strictEqual(sanitized, 'My_Awesome_File_Name.txt')
		})
	}
)
