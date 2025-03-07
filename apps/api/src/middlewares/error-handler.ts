import { APIError } from 'better-auth/api'
import type { Context } from 'hono'
import type { HTTPResponseError } from 'hono/types'
import type { ContentfulStatusCode, StatusCode } from 'hono/utils/http-status'

import { GenericException } from '../exceptions/index.js'
import { HttpStatusCodes } from '../utils/index.js'

export const errorHandler = (err: Error | HTTPResponseError, c: Context) => {
	const message = err.message || 'Internal Server Error'
	const status: StatusCode = 500

	if (err instanceof GenericException) {
		return c.json(err, err.statusCode as ContentfulStatusCode)
	}

	if (err instanceof APIError) {
		const status =
			(HttpStatusCodes.get(err.status as string) as StatusCode) || 500
		const error: GenericException = {
			statusCode: status,
			name: err.status as string,
			message: err.body.message || err.message
		}
		return c.json(error, status as ContentfulStatusCode)
	}

	const error: GenericException = {
		statusCode: status,
		name: 'Internal Server Error',
		message,
		stack: err.stack,
		cause: err.cause
	}

	return c.json(error, status)
}
