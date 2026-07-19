import * as argon2 from 'argon2'
import { gt, isNull, or } from 'drizzle-orm'
import { pastesTable } from '../db/schema.js'
import { GenericException } from '../exceptions/generic-exception.js'

type PasteAccessRecord = Pick<
	typeof pastesTable.$inferSelect,
	'userId' | 'visibility' | 'expiresAt' | 'passwordHash' | 'encrypted'
>

export type PasteReadMode = 'details' | 'verify' | 'download' | 'raw' | 'fork'

export interface PasteReader {
	id: string
	role?: string | null
}

interface PasteReadOptions {
	mode: PasteReadMode
	reader: PasteReader | null
	password?: string | null
	now?: Date
}

export interface PasteReadDecision {
	mode: PasteReadMode
	passwordProtected: boolean
	clientEncrypted: boolean
	canReadContent: boolean
}

export function activePasteCondition(now = new Date()) {
	return or(isNull(pastesTable.expiresAt), gt(pastesTable.expiresAt, now))
}

export function isPasteExpired(
	paste: Pick<PasteAccessRecord, 'expiresAt'>,
	now = new Date()
): boolean {
	return paste.expiresAt !== null && paste.expiresAt <= now
}

export async function authorizePasteRead(
	paste: PasteAccessRecord,
	options: PasteReadOptions
): Promise<PasteReadDecision> {
	const { reader, mode, password, now = new Date() } = options

	if (isPasteExpired(paste, now)) {
		throwPasteNotFound()
	}

	// Administrators did not previously have an implicit read bypass. Keep that
	// contract here; administrative listing remains a separate guarded route.
	if (paste.visibility === 'private' && paste.userId !== reader?.id) {
		throwPasteNotFound()
	}

	const passwordProtected = paste.passwordHash !== null
	let canReadContent = !passwordProtected

	if (mode === 'verify' && !passwordProtected) {
		throw new GenericException({
			statusCode: 400,
			name: 'Bad Request',
			message: 'Paste is not password protected'
		})
	}

	if (mode === 'download' && password && !passwordProtected) {
		throw new GenericException({
			statusCode: 400,
			name: 'Bad Request',
			message: 'Paste is not password protected'
		})
	}

	if ((mode === 'verify' || mode === 'download') && passwordProtected) {
		if (!password) {
			throw new GenericException({
				statusCode: mode === 'download' ? 401 : 400,
				name: mode === 'download' ? 'Unauthorized' : 'Bad Request',
				message:
					mode === 'download'
						? 'Password required to download this paste'
						: 'Password is required'
			})
		}

		const passwordValid = await argon2.verify(
			paste.passwordHash as string,
			password
		)
		if (!passwordValid) {
			throw new GenericException({
				statusCode: 403,
				name: 'Forbidden',
				message: 'Invalid password'
			})
		}

		canReadContent = true
	}

	return {
		mode,
		passwordProtected,
		clientEncrypted: paste.encrypted ?? false,
		canReadContent
	}
}

export function throwPasteNotFound(): never {
	throw new GenericException({
		statusCode: 404,
		name: 'Not Found',
		message: 'Paste not found'
	})
}
