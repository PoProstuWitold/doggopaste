import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { GenericException } from '../exceptions/index.js'

const paramStringSlug = z.object({
	slug: z.string({
		message: 'Id must be a string'
	})
})

export const validatorParamStringSlug = zValidator(
	'param',
	paramStringSlug,
	async (result, _c) => {
		if (!result.success) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid id',
				details: [
					{
						id:
							result.success === false
								? result.error.issues[0].message
								: 'Invalid id',
						value: String(result.data.slug)
					}
				]
			})
		}
	}
)

const paramStringId = z.object({
	id: z.string({
		message: 'Id must be a string'
	})
})

export const validatorParamStringId = zValidator(
	'param',
	paramStringId,
	async (result, _c) => {
		if (!result.success) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid id',
				details: [
					{
						id:
							result.success === false
								? result.error.issues[0].message
								: 'Invalid id',
						value: String(result.data.id)
					}
				]
			})
		}
	}
)

const createPasteSchema = z.object({
	title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
	slug: z
		.string()
		.min(1, 'Slug is required')
		.max(40, 'Slug is too long')
		.regex(
			/^[a-z0-9-]+$/,
			'Slug can only contain lowercase letters, numbers, and hyphens'
		)
		.transform((val) => val.toLowerCase())
		.optional(),
	content: z.string().min(1, 'Content cannot be empty'),
	category: z
		.enum(
			[
				'none',
				'cryptocurrency',
				'cybersecurity',
				'software',
				'fixit',
				'gaming'
			],
			{
				errorMap: () => ({ message: 'Invalid category' })
			}
		)
		.default('none'),
	tags: z.array(z.string().transform((val) => val.toLowerCase())).default([]),
	syntax: z.string().min(1, 'Syntax is required'),
	expiration: z
		.enum(['never', 'burn_after_read', '10m', '1h', '1d', '1w', '2w'], {
			errorMap: () => ({ message: 'Invalid expiration option' })
		})
		.default('never'),
	visibility: z
		.enum(['public', 'private', 'unlisted'], {
			errorMap: () => ({ message: 'Invalid visibility option' })
		})
		.default('public'),
	folder: z.string().optional().default('none'),
	passwordEnabled: z.boolean().default(false),
	password: z.string().optional().or(z.literal('')),
	pasteAsGuest: z.boolean().default(false)
})

export const validatorCreatePasteJson = zValidator(
	'json',
	createPasteSchema,
	async (result, _c) => {
		if (!result.success) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid paste data',
				details:
					result.success === false
						? result.error.issues.map((issue) => ({
								[issue.path.join('.')]: issue.message
							}))
						: []
			})
		}
	}
)
