import {
	boolean,
	integer,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar
} from 'drizzle-orm/pg-core'

const essentialColumns = {
	id: uuid().primaryKey().defaultRandom(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
}

export const usersTable = pgTable('users', {
	...essentialColumns,
	name: varchar({ length: 512 }).notNull().unique(),
	email: varchar({ length: 512 }).notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: varchar({ length: 512 }),
	// admin plugin
	role: varchar({ length: 512 }),
	banned: boolean(),
	banReason: varchar({ length: 512 }),
	banExpires: numeric()
})

export const sessionsTable = pgTable('sessions', {
	...essentialColumns,
	userId: uuid('user_id')
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	token: varchar({ length: 512 }).notNull().unique(),
	expiresAt: timestamp('expires_at').notNull(),
	ipAddress: varchar('ip_address', { length: 512 }),
	userAgent: varchar('user_agent', { length: 512 }),
	// admin plugin
	impersonatedBy: uuid(),
	// organization plugin
	activeOrganizationId: uuid(),
	activeTeamId: uuid()
})

export const accountsTable = pgTable('accounts', {
	...essentialColumns,
	userId: uuid('user_id')
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	accountId: varchar('account_id', { length: 512 }).notNull().unique(),
	providerId: varchar('provider_id', { length: 512 }).notNull(),
	accessToken: varchar('access_token', { length: 512 }),
	refreshToken: varchar('refresh_token', { length: 512 }),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: varchar({ length: 512 }),
	idToken: varchar('id_token', { length: 512 }),
	password: varchar({ length: 512 })
})

export const verificationsTable = pgTable('verifications', {
	...essentialColumns,
	identifier: varchar({ length: 512 }).notNull(),
	value: varchar({ length: 512 }).notNull(),
	expiresAt: timestamp('expires_at').notNull()
})

export const organizationsTable = pgTable('organizations', {
	...essentialColumns,
	name: varchar({ length: 512 }).notNull().unique(),
	slug: varchar({ length: 512 }).notNull().unique(),
	logo: varchar({ length: 512 }),
	metadata: varchar({ length: 512 })
})

export const membersTable = pgTable('members', {
	...essentialColumns,
	userId: uuid('user_id')
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizationsTable.id, { onDelete: 'cascade' }),
	role: varchar({ length: 512 })
})

export const invitationsTable = pgTable('invitations', {
	...essentialColumns,
	email: varchar({ length: 512 }),
	inviterId: uuid('inviter_id')
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizationsTable.id, { onDelete: 'cascade' }),
	role: varchar({ length: 512 }),
	status: varchar({ length: 512 }),
	expiresAt: timestamp('expires_at').notNull()
})

// PROJECT SPECIFIC
// typy wyliczeniowe
export const visibilityEnum = pgEnum('visibility', [
	'public',
	'private',
	'unlisted',
	'organization'
])
export const realTimePasteVisibilityEnum = pgEnum('visibility', [
	'public',
	'organization'
])
export const expirationEnum = pgEnum('expiration', [
	'never',
	'burn_after_read',
	'10m',
	'1h',
	'1d',
	'1w',
	'2w'
])
export const categoryEnum = pgEnum('category', [
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
])

export const syntaxesTable = pgTable('syntaxes', {
	...essentialColumns,
	name: varchar({ length: 64 }).notNull().unique(),
	extension: varchar({ length: 32 }),
	color: varchar({ length: 32 }).notNull()
})

// pastes (wklejki kodu)
export const pastesTable = pgTable('pastes', {
	...essentialColumns,
	userId: uuid('user_id').references(() => usersTable.id, {
		onDelete: 'set null'
	}), // null dla gości
	folderId: uuid('folder_id').references(() => foldersTable.id, {
		onDelete: 'set null'
	}), // folder pasty
	title: varchar({ length: 128 }).notNull(),
	description: varchar({ length: 512 }), // opcjonalny opis
	slug: varchar({ length: 64 }).unique(), // niestandardowy URL
	category: categoryEnum('category').notNull().default('none'),
	content: text('content').notNull(),
	syntaxId: uuid('syntax_id').references(() => syntaxesTable.id, {
		onDelete: 'set null'
	}),
	expiresAt: timestamp('expires_at'), // Data, kiedy pasta wygaśnie
	expiration: expirationEnum('expiration').notNull().default('never'), // Typ wygaśnięcia
	passwordHash: varchar('password_hash', { length: 512 }), // hasło do pasty
	hits: integer().notNull().default(0).$type<number>(), // liczba odsłon
	visibility: visibilityEnum('visibility').notNull().default('public'),
	// Jeśli widoczność = "organization"
	organizationId: uuid('organization_id').references(
		() => organizationsTable.id,
		{ onDelete: 'set null' }
	)
})

// folders (foldery na pasty)
export const foldersTable = pgTable('folders', {
	...essentialColumns,
	userId: uuid('user_id')
		.notNull()
		.references(() => usersTable.id, { onDelete: 'cascade' }),
	name: varchar({ length: 512 }).notNull(),
	parentFolderId: uuid('parent_folder_id').references(() => foldersTable.id, {
		onDelete: 'set null'
	})
})

// tags (tagi do past)
export const tagsTable = pgTable('tags', {
	...essentialColumns,
	name: varchar({ length: 32 }).notNull().unique()
})

// M:N -> Pasty <-> Tagi
export const pasteTagsTable = pgTable('paste_tags', {
	id: uuid().primaryKey().defaultRandom(),
	pasteId: uuid('paste_id')
		.notNull()
		.references(() => pastesTable.id, { onDelete: 'cascade' }),
	tagId: uuid('tag_id')
		.notNull()
		.references(() => tagsTable.id, { onDelete: 'cascade' })
})

export const realTimePastesTable = pgTable('realtime_pastes', {
	...essentialColumns,
	title: varchar({ length: 128 }).notNull(),
	slug: varchar({ length: 64 }).unique().notNull(),
	content: text('content').notNull(), // treść edytowana w czasie rzeczywistym
	syntaxId: uuid('syntax_id').references(() => syntaxesTable.id, {
		onDelete: 'set null'
	}),
	visibility: realTimePasteVisibilityEnum('visibility')
		.notNull()
		.default('public'),
	organizationId: uuid('organization_id').references(
		() => organizationsTable.id,
		{ onDelete: 'set null' }
	)
})

export const schema = {
	users: usersTable,
	sessions: sessionsTable,
	accounts: accountsTable,
	verifications: verificationsTable,
	organizations: organizationsTable,
	members: membersTable,
	invitations: invitationsTable,
	// PROJECT SPECIFIC
	pastes: pastesTable,
	folders: foldersTable,
	tags: tagsTable,
	pasteTags: pasteTagsTable,
	realTimePastes: realTimePastesTable,
	syntaxes: syntaxesTable
}
