import { APIError } from 'better-auth/api'
import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'
import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status'

import { GenericException } from '../exceptions/index.js'
import { HttpStatusCodes } from '../utils/index.js'

// biome-ignore lint: no need to know exact error type
function conflictize(err: any) {
	const text = `${err?.message ?? ''} ${String(err?.cause ?? '')}`

	if (err?.code === '23505' || /duplicate key/i.test(text)) {
		const m =
			text.match(/unique constraint "([^"]+)"/i) ||
			text.match(/constraint "([^"]+?)(?:_unique|_key)"/i)

		let message = 'Value already exists'
		if (m?.[1]) {
			const name = m[1].replace(/_(unique|key)$/i, '')
			const parts = name.split('_')
			const column =
				parts.length >= 2 ? parts.slice(1).join('_') : parts[0]
			message = `Value '${column}' already exists`
		}

		err.name = 'Conflict'
		err.statusCode = 409
		err.message = message
	}

	return err
}

export const errorHandler = (rawErr: Error | HTTPResponseError, c: Context) => {
	// 1) domain exceptions - return as is
	if (rawErr instanceof GenericException) {
		return c.json(rawErr, rawErr.statusCode as ContentfulStatusCode)
	}

	// 2) APIError - map according to status code
	if (rawErr instanceof APIError) {
		const mapped =
			(HttpStatusCodes.get(rawErr.status as string) as StatusCode) || 500
		const error: GenericException = {
			statusCode: mapped,
			name: rawErr.status as string,
			message: rawErr.body?.message || rawErr.message
		}
		return c.json(error, mapped as ContentfulStatusCode)
	}

	// 3) rest - try to conflictize and return 500 by default
	// biome-ignore lint: no need to know exact error type
	const err: any = conflictize(rawErr)

	const status: StatusCode =
		(Number(err?.statusCode) as StatusCode) || (500 as StatusCode)

	const error: GenericException = {
		statusCode: status,
		name: err?.name ?? 'Internal Server Error',
		message: err?.message ?? 'Internal Server Error'
	}

	return c.json(error, status as ContentfulStatusCode)
}
