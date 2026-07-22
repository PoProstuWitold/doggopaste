export interface SessionDto {
	id: string
	expiresAt: Date
	createdAt: Date
	updatedAt: Date
	userAgent?: string | null
	ipAddress?: string | null
	isCurrent: boolean
}

export interface ViewerDto {
	id: string
	name: string
	role: string | null
}

export interface RealtimeViewerDto {
	name: string
}

export interface ProfileUserDto extends ViewerDto {
	createdAt: Date
	updatedAt: Date
	email: string
	emailVerified: boolean
}

export interface PublicUserDto {
	id: string
	name: string
	createdAt: string
	role: string | null
}

export interface AccountDto {
	id: string
	providerId: string
	createdAt: Date
	updatedAt: Date
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
	description: string
	content: string
	category: string
	tags: string[]
	syntax: string
	expiration: string
	visibility: string
	folder: string
	passwordEnabled: boolean
	password: string | undefined
	encrypted: boolean
	pasteAsGuest: boolean
}

export interface Syntax {
	name: string
	color: string
	extension: string | null
}

export interface PasteSummary {
	id: string
	createdAt: string
	updatedAt: string
	userId: string | null
	folderId: string | null
	title: string
	slug: string
	description: string
	category: string
	syntax: Syntax
	expiresAt: string | null
	expiration: string
	encrypted: boolean
	passwordProtected: boolean
	hits: number
	visibility: string
	tags: string[]
}

export interface Paste extends PasteSummary {
	content: string
}

export interface PasteResponse {
	success: boolean
	data: Paste
	message?: string
}

export interface VerifyPasteResponse {
	success: boolean
	content: string
}

export interface ApiMessageResponse {
	success: boolean
	message: string
}

export interface ApiErrorDto {
	statusCode?: number
	name?: string
	message?: string
	error?: string
	details?: Array<Record<string, string>>
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
	syntaxId: string | null
	organizationId: string | null
}

export interface RealtimePasteResponse {
	success: boolean
	data: RealtimePaste
}

export interface RealtimePasteCreateResponse {
	success: boolean
	realtimePaste: RealtimePaste
	viewer: RealtimeViewerDto | null
}

export interface FolderDto {
	id: string
	name: string
	parentFolderId: string | null
	createdAt: string
	updatedAt: string
	userId: string
}

export interface Folder extends FolderDto {
	subfoldersCount: number
	pastesCount: number
}

export interface ApiDataResponse<T> {
	success: boolean
	data: T
	message?: string
}

export interface PaginatedResponse<T> {
	success: boolean
	data: T[]
	total: number
}

export interface AdminSyntaxDto {
	id: string
	name: string
	extension: string | null
	color: string
}

export interface AdminTagDto {
	id: string
	name: string
}

export interface AdminPasteDto {
	paste: {
		id: string
		title: string
		slug: string | null
		visibility: 'public' | 'private' | 'unlisted' | 'organization'
		createdAt: string
		updatedAt: string
	}
	user: {
		id: string
		name: string
	} | null
	syntax: AdminSyntaxDto | null
}

export interface AdminRealtimePasteDto {
	paste: Omit<RealtimePaste, 'syntax'>
	syntax: Omit<AdminSyntaxDto, 'id'> | null
}

export type AdminPastesResponse = ApiDataResponse<{
	pastes: AdminPasteDto[]
}>

export type AdminRealtimePastesResponse = ApiDataResponse<{
	realtimePastes: AdminRealtimePasteDto[]
}>

export type AdminTagsResponse = ApiDataResponse<{
	tags: AdminTagDto[]
}>

export type AdminSyntaxesResponse = ApiDataResponse<{
	syntaxes: AdminSyntaxDto[]
}>

export interface AdminUserDto {
	id: string
	name: string
	email: string
	createdAt: string
}

export interface HealthDto {
	status: string
	description: string
	version: string
	isDocker: boolean
	node: string
	uptime: number
	timestamp: string
	services: Record<string, { connected: boolean; latencyMs?: number }>
}
