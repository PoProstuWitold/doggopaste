import {
	boolean,
	numeric,
	pgTable,
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
	name: varchar({ length: 512 }).notNull(),
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
		.references(() => usersTable.id),
	token: varchar({ length: 512 }).notNull().unique(),
	expiresAt: timestamp('expires_at').notNull(),
	ipAddress: varchar('ip_address', { length: 512 }),
	userAgent: varchar('user_agent', { length: 512 }),
	// admin plugin
	impersonatedBy: uuid(),
	// organization plugin
	activeOrganizationId: uuid()
})

export const accountsTable = pgTable('accounts', {
	...essentialColumns,
	userId: uuid('user_id')
		.notNull()
		.references(() => usersTable.id),
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
		.references(() => usersTable.id),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizationsTable.id),
	role: varchar({ length: 512 })
})

export const invitationsTable = pgTable('invitations', {
	...essentialColumns,
	email: varchar({ length: 512 }),
	inviterId: uuid('inviter_id')
		.notNull()
		.references(() => usersTable.id),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizationsTable.id),
	role: varchar({ length: 512 }),
	status: varchar({ length: 512 }),
	expiresAt: timestamp('expires_at').notNull()
})

// optional for organization plugin
export const teamsTable = pgTable('teams', {
	...essentialColumns,
	name: varchar({ length: 512 }).notNull(),
	organizationId: uuid('organization_id')
		.notNull()
		.references(() => organizationsTable.id)
})

export const schema = {
	users: usersTable,
	sessions: sessionsTable,
	accounts: accountsTable,
	verifications: verificationsTable,
	organizations: organizationsTable,
	members: membersTable,
	invitations: invitationsTable,
	teams: teamsTable
}
