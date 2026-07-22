import { getBaseApiUrl } from './functions'

export type ApiRequestOptions = Omit<RequestInit, 'body'> & {
	body?: BodyInit | null
	json?: unknown
}

export interface ApiResult<T> {
	data: T | null
	ok: boolean
	response: Response
	status: number
}

export async function apiRequest<T = unknown>(
	path: string,
	options: ApiRequestOptions = {}
): Promise<ApiResult<T>> {
	if (!path.startsWith('/')) {
		throw new TypeError('API path must start with /')
	}
	if (options.json !== undefined && options.body !== undefined) {
		throw new TypeError('Use either json or body, not both')
	}

	const { json, headers: initialHeaders, ...requestOptions } = options
	const headers = new Headers(initialHeaders)
	let body = requestOptions.body

	if (json !== undefined) {
		if (!headers.has('Content-Type')) {
			headers.set('Content-Type', 'application/json')
		}
		body = JSON.stringify(json)
	}

	const response = await fetch(`${getBaseApiUrl()}${path}`, {
		...requestOptions,
		body,
		credentials: requestOptions.credentials ?? 'include',
		headers
	})

	let data: T | null = null
	if (response.status !== 204 && response.status !== 205) {
		const text = await response.text()
		if (text) {
			try {
				data = JSON.parse(text) as T
			} catch {
				data = null
			}
		}
	}

	return {
		data,
		ok: response.ok,
		response,
		status: response.status
	}
}

export function getApiErrorMessage(value: unknown, fallback: string): string {
	if (!value || typeof value !== 'object') return fallback

	const error = value as { error?: unknown; message?: unknown }
	if (typeof error.message === 'string' && error.message) {
		return error.message
	}
	if (typeof error.error === 'string' && error.error) return error.error
	return fallback
}
