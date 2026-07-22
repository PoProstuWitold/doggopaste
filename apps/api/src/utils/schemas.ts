import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { GenericException } from '../exceptions/index.js'
import { REQUEST_LIMITS } from './request-limits.js'

const paramStringSlug = z.object({
	slug: z
		.string({
			error: 'Id must be a string'
		})
		.min(1, 'Id cannot be empty')
		.max(REQUEST_LIMITS.paste.routeSlug, 'Id is too long')
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
						value: String(result.data?.slug ?? '')
					}
				]
			})
		}
	}
)

export const realtimeSlugSchema = z
	.string({
		error: 'Realtime slug must be a string'
	})
	.min(1, 'Realtime slug cannot be empty')
	.max(REQUEST_LIMITS.paste.routeSlug, 'Realtime slug is too long')
	.regex(
		/^[A-Za-z0-9-]+$/,
		'Realtime slug can only contain letters, numbers, and hyphens'
	)

export const isValidRealtimeSlug = (value: unknown): value is string =>
	realtimeSlugSchema.safeParse(value).success

const paramRealtimeSlug = z.object({
	slug: realtimeSlugSchema
})

export const validatorParamRealtimeSlug = zValidator(
	'param',
	paramRealtimeSlug,
	async (result, _c) => {
		if (result.success === false) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid realtime slug',
				details: result.error.issues.map((issue) => ({
					slug: issue.message,
					value: String(result.data?.slug ?? '')
				}))
			})
		}
	}
)

const paramStringId = z.object({
	id: z.uuid('Id must be a valid UUID')
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
						value: String(result.data?.id ?? '')
					}
				]
			})
		}
	}
)

function paginationInteger(defaultValue: number) {
	return z.preprocess(
		(value) => (value === undefined ? String(defaultValue) : value),
		z
			.string()
			.regex(/^\d+$/, 'Must be an integer')
			.transform(Number)
			.pipe(z.number().int('Must be an integer'))
	)
}

export const paginationQuerySchema = z.object({
	limit: paginationInteger(10).pipe(
		z
			.number()
			.min(1, 'Limit must be at least 1')
			.max(100, 'Limit cannot exceed 100')
	),
	offset: paginationInteger(0).pipe(
		z.number().min(0, 'Offset cannot be negative')
	)
})

export const validatorPaginationQuery = zValidator(
	'query',
	paginationQuerySchema,
	async (result, _c) => {
		if (result.success === false) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid pagination parameters',
				details: result.error.issues.map((issue) => ({
					[issue.path.join('.')]: issue.message
				}))
			})
		}
	}
)

export const userPastesQuerySchema = paginationQuerySchema.extend({
	userId: z.uuid('User id must be a valid UUID').optional()
})

export const validatorUserPastesQuery = zValidator(
	'query',
	userPastesQuerySchema,
	async (result, _c) => {
		if (result.success === false) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid user paste query parameters',
				details: result.error.issues.map((issue) => ({
					[issue.path.join('.')]: issue.message
				}))
			})
		}
	}
)

export const createPasteSchema = z
	.object({
		title: z
			.string()
			.min(1, 'Title is required')
			.max(REQUEST_LIMITS.paste.title, 'Title is too long'),
		slug: z
			.string()
			.max(REQUEST_LIMITS.paste.createSlug, 'Slug is too long')
			.refine(
				(val) => val === '' || /^[a-z0-9-]+$/.test(val),
				'Slug can only contain lowercase letters, numbers, and hyphens'
			)
			.transform((val) => val.toLowerCase()),
		description: z
			.string()
			.max(REQUEST_LIMITS.paste.description, 'Description is too long')
			.optional()
			.or(z.literal(''))
			.default(''),
		content: z
			.string()
			.min(1, 'Content cannot be empty')
			.max(REQUEST_LIMITS.paste.content, 'Content is too long'),
		category: z
			.enum(
				[
					'none',
					'cryptocurrency',
					'cybersecurity',
					'fixit',
					'gaming',
					'help',
					'software',
					'note',
					'config',
					'question',
					'log',
					'project',
					'snippet',
					'education'
				],
				{
					error: 'Invalid category'
				}
			)
			.default('none'),
		tags: z
			.array(
				z
					.string()
					.min(1, 'Tag cannot be empty')
					.max(
						REQUEST_LIMITS.paste.tag,
						`Tag is too long (max ${REQUEST_LIMITS.paste.tag} characters)`
					)
					.regex(
						/^[a-z][a-z0-9]*$/,
						'Tag must start with a letter and contain only lowercase letters or digits'
					)
					.transform((val) => val.toLowerCase())
			)
			.max(
				REQUEST_LIMITS.paste.tags,
				`Too many tags (max ${REQUEST_LIMITS.paste.tags})`
			)
			.default([]),
		syntax: z
			.string()
			.min(1, 'Syntax is required')
			.max(REQUEST_LIMITS.paste.syntax, 'Syntax is too long'),
		expiration: z
			.enum(['never', 'burn_after_read', '10m', '1h', '1d', '1w', '2w'], {
				error: 'Invalid expiration option'
			})
			.default('never'),
		visibility: z
			.enum(['public', 'private', 'unlisted'], {
				error: 'Invalid visibility option'
			})
			.default('public'),
		folder: z
			.union([z.literal('none'), z.uuid('Invalid folder id')])
			.optional()
			.default('none'),
		pasteAsGuest: z.boolean().default(false),
		passwordEnabled: z.boolean().default(false),
		password: z
			.string()
			.max(REQUEST_LIMITS.paste.password, 'Password is too long')
			.nullish(),
		encrypted: z.boolean().default(false)
	})
	.superRefine((data, ctx) => {
		if (data.passwordEnabled) {
			if (!data.encrypted) {
				if (!data.password || data.password.trim() === '') {
					ctx.addIssue({
						code: 'custom',
						message:
							'Password is required when encryption is disabled',
						path: ['password']
					})
				}
			}
		}
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

export const verifyPasteSchema = z.object({
	password: z
		.string()
		.min(1, 'Password is required')
		.max(REQUEST_LIMITS.paste.password, 'Password is too long')
})

export const downloadPasteSchema = z.object({
	password: z
		.string()
		.max(REQUEST_LIMITS.paste.password, 'Password is too long')
		.refine(
			(password) => password.trim().length > 0,
			'Password is required'
		)
})

const downloadPasteJsonValidator = zValidator(
	'json',
	downloadPasteSchema,
	async (result, _c) => {
		if (result.success === false) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid download data',
				details: result.error.issues.map((issue) => ({
					[issue.path.join('.')]: issue.message
				}))
			})
		}
	}
)

export const validatorDownloadPasteJson: typeof downloadPasteJsonValidator =
	async (c, next) => {
		try {
			return await downloadPasteJsonValidator(c, next)
		} catch (error) {
			if (error instanceof HTTPException && error.status === 400) {
				throw new GenericException({
					statusCode: 400,
					name: 'Bad Request',
					message: 'Invalid download data'
				})
			}

			throw error
		}
	}

/* ---------- helpers ---------- */

function toDetails(issues: z.core.$ZodIssue[]) {
	return issues.map((issue) => ({
		[issue.path.join('.')]: issue.message
	}))
}

/* ---------- schemas ---------- */

// POST /folders  (create)
export const createFolderSchema = z.object(
	{
		name: z
			.string()
			.min(3, 'Name too short')
			.max(40, 'Name too long')
			.regex(
				/^[A-Za-z][A-Za-z0-9]*$/,
				'Name must start with a letter and contain only letters or digits'
			)
			.transform((val) => val),
		parentId: z.uuid('invalid parentId').nullable().optional()
	},
	{
		error: 'Folder name must start with a letter and contain only letters or digits'
	}
)

// GET /folders?parentId=...  (list by parent)
export const listFoldersQuerySchema = z.object({
	parentId: z.uuid('invalid parentId').or(z.literal('null')).optional()
})

// GET /folders/all  (no schema needed)

// PATCH /folders/:id  (update)
export const updateFolderSchema = z.object(
	{
		name: z
			.string()
			.min(3, 'Name too short')
			.max(40, 'Name too long')
			.regex(
				/^[A-Za-z][A-Za-z0-9]*$/,
				'Name must start with a letter and contain only letters or digits'
			)
	},
	{
		error: 'Folder name must start with a letter and contain only letters or digits'
	}
)

// :id param validator (used by PATCH/DELETE)
export const folderIdParamSchema = z.object({
	id: z.uuid('invalid folder id')
})

/* ---------- validators ---------- */

// POST /folders
export const validatorCreateFolderJson = zValidator(
	'json',
	createFolderSchema,
	async (result, _c) => {
		if (!result.success) {
			const issues = (result as typeof result & { success: false }).error
				.issues
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: issues[0]?.message || 'Invalid folder data',
				details: toDetails(issues)
			})
		}
	}
)

// GET /folders?parentId=...
export const validatorListFoldersQuery = zValidator(
	'query',
	listFoldersQuerySchema,
	async (result, _c) => {
		if (!result.success) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid query parameters',
				//@ts-expect-error
				details: toDetails(result.error.issues)
			})
		}
	}
)

// PATCH /folders/:id
export const validatorUpdateFolderJson = zValidator(
	'json',
	updateFolderSchema,
	async (result, _c) => {
		if (!result.success) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid folder update data',
				//@ts-expect-error
				details: toDetails(result.error.issues)
			})
		}
	}
)

// :id param (PATCH/DELETE)
export const validatorFolderIdParam = zValidator(
	'param',
	folderIdParamSchema,
	async (result, _c) => {
		if (!result.success) {
			throw new GenericException({
				statusCode: 400,
				name: 'Bad Request',
				message: 'Invalid folder id',
				//@ts-expect-error
				details: toDetails(result.error.issues)
			})
		}
	}
)
