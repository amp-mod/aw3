import {
	pgTable,
	smallint,
	text,
	timestamp,
	varchar,
	index,
	char,
	inet,
	integer,
	boolean,
	jsonb,
	primaryKey,
	bigint,
	customType,
	uuid,
	uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// --- CUSTOM TYPES ---

const tsvector = customType<{ data: string }>({
	dataType() {
		return 'tsvector'
	},
})

// --- TABLES ---

export const user = pgTable(
	'user',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		username: varchar('username', { length: 20 }).notNull().unique(),
		displayName: varchar({ length: 30 }).default(''),
		passwordHash: text('password_hash').notNull(),
		termsRevision: integer('tos_revision').default(0),
		privacyRevision: integer('pp_revision').default(0),
		rank: smallint('rank').default(0),
		bio: varchar({ length: 2000 }).default(''),
		hasPFP: boolean().default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		isPrivate: boolean().default(false),
		featuredProjectId: integer('featured_project_id').references(() => project.id, {
			onDelete: 'set null',
		}),
		featuredProjectTitleIndex: smallint('featured_project_title_index').default(0),
		passkeys: jsonb(),
		status: text('status').default('normal'),
		bannedExpiry: timestamp('banned_expiry', { withTimezone: true, mode: 'date' }),
		banReason: text('ban_reason'),
		scratchUsername: varchar('scratch_username', { length: 64 }).default(''),
		frame: varchar({ length: 32 }),
		usernameUpdatedAt: timestamp({ withTimezone: true, mode: 'date' })
			.notNull()
			.default(new Date(0)),
		inviteId: uuid().defaultRandom(),
		inviter: integer().references(() => user.id, { onDelete: 'set null' }),
		email: text(),
		isEmailVerified: boolean().notNull().default(false),
		verifyID: uuid().defaultRandom(),
		accentColour: text().default('#4fa55c'),
	},
	(table) => [index('username_idx').on(table.username)],
)

export const session = pgTable(
	'session',
	{
		id: char({ length: 64 }).primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		ip: inet('ip'),
		userAgent: text('user_agent'),
	},
	(table) => [index('user_id_idx').on(table.userId)],
)

export const project = pgTable(
	'project',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		userId: bigint('user_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: varchar({ length: 150 }).notNull(),
		instructions: varchar({ length: 2000 }).default(''),
		notes: varchar({ length: 2000 }).default(''),
		json: jsonb('json'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		moderatorNote: text('moderator_note'),
		image: text(),
		status: text('status').default('unshared'),
		original: bigint('original', { mode: 'number' }).references(() => project.id, {
			onDelete: 'set null',
			onUpdate: 'cascade',
		}),
		scratchProjectID: text(),
		searchIndex: tsvector('search_index'),
	},
	(table) => [
		index('project_id_idx').on(table.id),
		index('project_user_id_idx').on(table.userId),
		index('project_search_idx').using('gin', table.searchIndex),
	],
)

export const studio = pgTable(
	'studio',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		hostId: bigint('host_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: varchar({ length: 150 }).notNull(),
		description: varchar({ length: 2000 }).default(''),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		moderatorNote: text('moderator_note'),
		image: text(),
		hidden: boolean('hidden').default(false),
		searchIndex: tsvector('search_index'),
	},
	(table) => [
		index('studio_host_id_idx').on(table.hostId),
		index('studio_search_idx').using('gin', table.searchIndex),
	],
)

export const studioCurators = pgTable(
	'studio_curators',
	{
		studioId: bigint('studio_id', { mode: 'number' })
			.notNull()
			.references(() => studio.id, { onDelete: 'cascade' }),
		userId: bigint('user_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		isManager: boolean().notNull().default(false),
	},
	(t) => [
		primaryKey({ columns: [t.studioId, t.userId] }),
		index('studio_curator_idx').on(t.studioId, t.userId),
	],
)

export const projectsToStudios = pgTable(
	'projects_to_studios',
	{
		projectId: bigint('project_id', { mode: 'number' })
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		studioId: bigint('studio_id', { mode: 'number' })
			.notNull()
			.references(() => studio.id, { onDelete: 'cascade' }),
	},
	(t) => [
		primaryKey({ columns: [t.projectId, t.studioId] }),
		index('project_studio_idx').on(t.studioId),
	],
)

export const auditLog = pgTable(
	'audit_log',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		action: text('action').notNull(),
		actorId: bigint('actor_id', { mode: 'number' }).references(() => user.id),
		targetId: bigint('target_id', { mode: 'number' }),
		targetType: text('target_type'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		extra: jsonb('extra'),
	},
	(table) => [
		index('audit_actor_idx').on(table.actorId),
		index('audit_target_idx').on(table.targetType, table.targetId),
	],
)

export const featuredProject = pgTable(
	'featured_project',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
		projectId: bigint('project_id', { mode: 'number' })
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		why: text('why'),
	},
	(table) => [index('featured_project_id_idx').on(table.projectId)],
)

export const featuredStudio = pgTable(
	'featured_studio',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
		studioId: bigint('studio_id', { mode: 'number' })
			.notNull()
			.references(() => studio.id, { onDelete: 'cascade' }),
		why: text('why'),
	},
	(table) => [index('featured_studio_id_idx').on(table.studioId)],
)

export const config = pgTable('config', {
	key: text().primaryKey(),
	value: jsonb('config_value'),
})

export const authenticator = pgTable(
	'authenticator',
	{
		id: text('id').primaryKey(),
		userId: bigint('user_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 255 }).default('New Passkey'),
		publicKey: text('public_key').notNull(),
		counter: bigint('counter', { mode: 'number' }).notNull().default(0),
		deviceType: varchar('device_type', { length: 32 }).notNull(),
		backedUp: boolean('backed_up').notNull().default(false),
		transports: text('transports'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
	},
	(table) => [index('auth_user_id_idx').on(table.userId)],
)

export const follow = pgTable(
	'follow',
	{
		followerId: bigint('follower_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		followingId: bigint('following_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	},
	(t) => [
		primaryKey({ columns: [t.followerId, t.followingId] }),
		index('follower_idx').on(t.followerId),
		index('following_idx').on(t.followingId),
	],
)

export const notification = pgTable(
	'notification',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		recipientId: bigint('recipient_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		issuerId: bigint('issuer_id', { mode: 'number' }).references(() => user.id, {
			onDelete: 'set null',
		}),
		type: text('type').notNull(),
		targetId: bigint('target_id', { mode: 'number' }),
		targetType: text('target_type'),
		isRead: boolean('is_read').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		metadata: jsonb('metadata'),
	},
	(t) => [
		index('recipient_idx').on(t.recipientId),
		index('is_read_idx').on(t.isRead),
		index('notif_target_idx').on(t.targetType, t.targetId),
	],
)

export const report = pgTable('report', {
	itemId: bigint('recipient_id', { mode: 'number' }).notNull(),
	itemType: text('type').notNull(),
	chosenReason: varchar({ length: 64 }),
	description: varchar({ length: 1000 }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
	creator: bigint('user_id', { mode: 'number' })
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	isResolved: boolean().notNull().default(false),
})

export const projectLike = pgTable(
	'project_like',
	{
		userId: bigint('user_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		projectId: bigint('project_id', { mode: 'number' })
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.projectId] }),
		index('project_like_project_idx').on(t.projectId),
		index('project_like_user_idx').on(t.userId),
	],
)

export const projectView = pgTable(
	'project_view',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		projectId: bigint('project_id', { mode: 'number' })
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		userId: bigint('user_id', { mode: 'number' }).references(() => user.id, {
			onDelete: 'set null',
		}),
		// Anonymous browser identifier from cookie
		visitorId: varchar('visitor_id', { length: 36 }),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	},
	(t) => [
		index('project_view_project_idx').on(t.projectId),
		index('project_view_created_at_idx').on(t.createdAt),
		// Ensures 1 view per user per project
		index('unique_user_view_idx').on(t.projectId, t.userId),
		// Ensures 1 view per visitor cookie per project
		index('unique_visitor_view_idx').on(t.projectId, t.visitorId),
	],
)

export const comment = pgTable(
	'comment',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		authorId: bigint('author_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		itemId: bigint('recipient_id', { mode: 'number' }).notNull(),
		itemType: text('type').notNull(),
		parentId: bigint('parent_id', { mode: 'number' }).references((): any => comment.id, {
			onDelete: 'cascade',
		}),
		content: varchar({ length: 2000 }).notNull(),
		isPinned: boolean('is_pinned').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	},
	(t) => [index('comment_author_idx').on(t.authorId), index('comment_parent_idx').on(t.parentId)],
)

// --- RELATIONS ---

export const userRelations = relations(user, ({ many }) => ({
	receivedNotifications: many(notification, { relationName: 'notif_recipient' }),
	issuedNotifications: many(notification, { relationName: 'notif_issuer' }),
	projects: many(project),
	sessions: many(session),
	authenticators: many(authenticator),
	followers: many(follow, { relationName: 'following' }),
	following: many(follow, { relationName: 'follower' }),
}))

export const notificationRelations = relations(notification, ({ one }) => ({
	recipient: one(user, {
		fields: [notification.recipientId],
		references: [user.id],
		relationName: 'notif_recipient',
	}),
	issuer: one(user, {
		fields: [notification.issuerId],
		references: [user.id],
		relationName: 'notif_issuer',
	}),
}))

export const projectRelations = relations(project, ({ one, many }) => ({
	author: one(user, {
		fields: [project.userId],
		references: [user.id],
	}),
	studios: many(projectsToStudios),
	remixes: many(project, { relationName: 'remix_relation' }),
	parent: one(project, {
		fields: [project.original],
		references: [project.id],
		relationName: 'remix_relation',
	}),
	likes: many(projectLike),
	views: many(projectView),
}))

export const followRelations = relations(follow, ({ one }) => ({
	follower: one(user, {
		fields: [follow.followerId],
		references: [user.id],
		relationName: 'follower',
	}),
	following: one(user, {
		fields: [follow.followingId],
		references: [user.id],
		relationName: 'following',
	}),
}))

export const userRedirects = pgTable(
	'user_redirects',
	{
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		fromUsername: varchar('from_username', { length: 20 }).notNull().unique(),
		redirectToUserId: bigint('redirect_to_user_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	},
	(table) => [
		index('user_redirect_from_idx').on(table.fromUsername),
		index('user_redirect_expires_idx').on(table.expiresAt),
	],
)

export const commentRelations = relations(comment, ({ one, many }) => ({
	author: one(user, {
		fields: [comment.authorId],
		references: [user.id],
	}),
	parent: one(comment, {
		fields: [comment.parentId],
		references: [comment.id],
		relationName: 'comment_replies',
	}),
	replies: many(comment, {
		relationName: 'comment_replies',
	}),
}))

// --- TYPES ---
export type Authenticator = typeof authenticator.$inferSelect
export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect
export type Project = typeof project.$inferSelect
export type Studio = typeof studio.$inferSelect
export type StudioCurator = typeof studioCurators.$inferSelect
export type ProjectToStudio = typeof projectsToStudios.$inferSelect
export type AuditLog = typeof auditLog.$inferSelect
export type FeaturedProject = typeof featuredProject.$inferSelect
export type FeaturedStudio = typeof featuredStudio.$inferSelect
export type Config = typeof config.$inferSelect
export type Follow = typeof follow.$inferSelect
export type Notification = typeof notification.$inferSelect
export type UserRedirects = typeof userRedirects.$inferSelect
