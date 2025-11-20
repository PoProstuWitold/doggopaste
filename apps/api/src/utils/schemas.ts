import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { GenericException } from '../exceptions/index.js'

const paramStringSlug = z.object({
	slug: z.string({
		error: 'Id must be a string'
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
		error: 'Id must be a string'
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
		.max(40, 'Slug is too long')
		.refine(
			(val) => val === '' || /^[a-z0-9-]+$/.test(val),
			'Slug can only contain lowercase letters, numbers, and hyphens'
		)
		.transform((val) => val.toLowerCase()),
	description: z
		.string()
		.max(255, 'Description is too long')
		.optional()
		.or(z.literal(''))
		.default(''),
	content: z.string().min(1, 'Content cannot be empty'),
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
				.max(16, 'Tag is too long (max 16 characters)')
				.regex(
					/^[a-z][a-z0-9]*$/,
					'Tag must start with a letter and contain only lowercase letters or digits'
				)
				.transform((val) => val.toLowerCase())
		)
		.default([]),
	syntax: z.string().min(1, 'Syntax is required'),
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
