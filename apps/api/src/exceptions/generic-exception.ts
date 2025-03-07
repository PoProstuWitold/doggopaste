import type { StatusCode } from 'hono/utils/http-status'

interface ExceptionOptions {
	statusCode: number
	message: string
	name?: string
	details?: Record<string, string>[]
}

export class GenericException extends Error {
	statusCode: StatusCode
	name: string
	details?: Record<string, string>[]

	constructor(options: ExceptionOptions) {
		super()
		this.statusCode = options.statusCode as StatusCode
		this.name = options.name || 'Internal Server Error'
		this.message = options.message
		this.details = options.details
	}
}
