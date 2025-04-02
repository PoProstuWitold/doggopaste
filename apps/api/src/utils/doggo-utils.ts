import { generate } from 'random-words'

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
				return new Date(now.getTime() + 24 * 60 * 60 * 1000) // to do: implement
			default: // also includes 'never'
				return null
		}
	}

	public static getFileExtension(syntax: string) {
		const syntaxToExtension = {
			plaintext: 'txt',
			javascript: 'js',
			typescript: 'ts',
			python: 'py',
			cpp: 'cpp',
			html: 'html',
			jsx: 'jsx',
			tsx: 'tsx'
		} as const

		const extension =
			syntaxToExtension[syntax as keyof typeof syntaxToExtension] || 'txt'
		return extension
	}

	public static sanitizeFileName(title: string): string {
		return title
			.replace(/[^\w\s.-]/g, '')
			.replace(/\s+/g, '_')
			.slice(0, 100)
	}
}
