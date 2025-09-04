import type { extensions } from './utils/functions'

export interface Session {
	id: string
	expiresAt: Date
	token: string
	createdAt: Date
	updatedAt: Date
	userAgent?: string | null
	ipAddress?: string | null
}

export interface User {
	id: string
	createdAt: Date
	updatedAt: Date
	name: string
	email: string
	emailVerified: boolean
	image?: string | null
	role?: string | null
	banned?: boolean | null
	banReason?: string | null
	banExpires?: Date | null
}

export interface SessionsProps {
	allSessions: Session[]
	currentSessionToken: string
}

export interface Account {
	id: string
	providerId: string
	createdAt: Date
	updatedAt: Date
	accountId: string
	scopes: string[]
}

export interface ChangePasswordData {
	currentPassword: string
	newPassword: string
	revokeOtherSessions?: boolean
}

export interface SignInData {
	email: string
	password: string
	rememberMe?: boolean
}

export interface SignUpData {
	name: string
	email: string
	password: string
	confirmPassword: string
}

export interface EditUserData {
	name: string
}

// Project specific types
export interface PasteForm {
	slug: string
	title: string
	content: string
	category: string
	tags: string[]
	syntax: string
	expiration: string
	visibility: string
	folder: string
	passwordEnabled: boolean
	password: string
	pasteAsGuest: boolean
}

export interface Syntax {
	name: keyof typeof extensions
	color: string
	extension: string | null
}

export interface Paste {
	id: string
	createdAt: string
	updatedAt: string
	userId: string | null
	folderId: string | null
	title: string
	slug: string
	category: string
	content: string
	syntax: Syntax
	expiresAt: string | null
	expiration: string
	passwordHash: string | null
	hits: string | number
	visibility: string
	organizationId: string | null
	tags: string[]
}

export interface PasteResponse {
	success: boolean
	data: Paste
}

export interface RealtimePaste {
	id: string
	createdAt: string
	updatedAt: string
	title: string
	slug: string
	content: string
	syntax: Syntax
	visibility: string
	userId: string | null
	folderId: string | null
	organizationId: string | null
}

export interface RealtimePasteResponse {
	success: boolean
	data: RealtimePaste
}
