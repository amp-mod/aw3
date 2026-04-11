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
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const user = pgTable(
	'user',
	{
		// main
		id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
		username: varchar('username', { length: 20 }).notNull().unique(),
		passwordHash: text('password_hash').notNull(),

		// legal
		termsRevision: integer('tos_revision').default(0),
		privacyRevision: integer('pp_revision').default(0),

		/*
         0 = new ampmodder
         1 = ampmodder
         2 = moderator
         3 = operator

         we most likely won't expand the number of ranks anytime soon,
         which is why this is a smallint
      */
		rank: smallint('rank').default(0),

		// profile
		bio: varchar({ length: 2000 }).default(''),
		hasPFP: boolean().default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		isPrivate: boolean().default(false),
		featuredProjectId: integer('featured_project_id').references(() => project.id, {
			onDelete: 'set null',
		}),
		featuredProjectTitleIndex: smallint('featured_project_title_index').default(0),

		// passkeys
		passkeys: jsonb(),

		// moderation
		status: text('status').default('normal'),
		bannedExpiry: timestamp('banned_expiry', { withTimezone: true, mode: 'date' }),
		banReason: text('ban_reason'),
	},
	(table) => [index('username_idx').on(table.username)],
)

export const session = pgTable(
	'session',
	{
		// SHA-256 results in 64 length hashes
		id: char({ length: 64 }).primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
		ip: inet('ip'), // only used for IP bans
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
		hidden: boolean('hidden').default(false),
		ccVersion: smallint('cc_version').default(4),
	},
	(table) => [index('project_id_idx').on(table.id), index('project_user_id_idx').on(table.userId)],
)

export const gallery = pgTable('gallery', {
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
})

export const galleryCurators = pgTable(
	'gallery_curators',
	{
		galleryId: bigint('gallery_id', { mode: 'number' })
			.notNull()
			.references(() => gallery.id, { onDelete: 'cascade' }),
		userId: bigint('user_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
	},
	(t) => [
		index('gallery_curator_idx').on(t.galleryId, t.userId),
		primaryKey({ columns: [t.galleryId, t.userId] }),
	],
)

export const projectsToGalleries = pgTable(
	'projects_to_galleries',
	{
		projectId: bigint('project_id', { mode: 'number' })
			.notNull()
			.references(() => project.id, { onDelete: 'cascade' }),
		galleryId: bigint('gallery_id', { mode: 'number' })
			.notNull()
			.references(() => gallery.id, { onDelete: 'cascade' }),
	},
	(t) => [primaryKey({ columns: [t.projectId, t.galleryId] })],
)

export const auditLog = pgTable('audit_log', {
	id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
	action: text('action').notNull(),
	actorId: bigint('actor_id', { mode: 'number' }).references(() => user.id),
	targetId: bigint('target_id', { mode: 'number' }),
	targetType: text('target_type'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	extra: jsonb('extra'),
})

export const featuredProject = pgTable('featured_project', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	projectId: bigint('project_id', { mode: 'number' })
		.notNull()
		.references(() => project.id, { onDelete: 'cascade' }),
	why: text('why'),
})

export const featuredGallery = pgTable('featured_gallery', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	galleryId: bigint('gallery_id', { mode: 'number' })
		.notNull()
		.references(() => gallery.id, { onDelete: 'cascade' }),
	why: text('why'),
})

export const config = pgTable('config', {
	key: text().primaryKey(),
	value: text(),
})

export const authenticator = pgTable(
	'authenticator',
	{
		// The unique ID returned by the browser (Base64URL encoded)
		id: text('id').primaryKey(),
		userId: bigint('user_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),

		// Friendly name (e.g., "Blue YubiKey", "Firefox Arch Linux")
		name: varchar('name', { length: 255 }).default('New Passkey'),

		// WebAuthn specific data
		publicKey: text('public_key').notNull(), // Store as Base64 string
		counter: bigint('counter', { mode: 'number' }).notNull().default(0),
		deviceType: varchar('device_type', { length: 32 }).notNull(),
		backedUp: boolean('backed_up').notNull().default(false),
		transports: text('transports'), // comma-separated or jsonb (e.g. "usb,nfc,internal")

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
	},
	(table) => [index('auth_user_id_idx').on(table.userId)],
)

export const follow = pgTable(
	'follow',
	{
		// The person doing the following
		followerId: bigint('follower_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		// The person being followed
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
		// The user who receives the notification
		recipientId: bigint('recipient_id', { mode: 'number' })
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		// The user who triggered the notification (optional, e.g., "System" notices)
		issuerId: bigint('issuer_id', { mode: 'number' }).references(() => user.id, {
			onDelete: 'set null',
		}),

		/* Types: 'follow', 'project_update', 'gallery_invite', 'featured', 'system'
		 */
		type: text('type').notNull(),

		// References to the object involved (Project ID, Gallery ID, etc.)
		targetId: bigint('target_id', { mode: 'number' }),
		targetType: text('target_type'), // e.g., 'project', 'gallery'

		isRead: boolean('is_read').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),

		// Flexible data for UI (e.g., "Project name was changed to X")
		metadata: jsonb('metadata'),
	},
	(t) => [index('recipient_idx').on(t.recipientId), index('is_read_idx').on(t.isRead)],
)
export const notificationRelations = relations(notification, ({ one }) => ({
	recipient: one(user, {
		fields: [notification.recipientId],
		references: [user.id],
		relationName: 'recipient',
	}),
	issuer: one(user, {
		fields: [notification.issuerId],
		references: [user.id],
		relationName: 'issuer',
	}),
}))

export const userRelations = relations(user, ({ many }) => ({
	notifications: many(notification),
}))

export type Authenticator = typeof authenticator.$inferSelect
export type User = typeof user.$inferSelect
export type Session = typeof session.$inferSelect
export type Project = typeof project.$inferSelect
export type Gallery = typeof gallery.$inferSelect
export type GalleryCurator = typeof galleryCurators.$inferSelect
export type ProjectToGallery = typeof projectsToGalleries.$inferSelect
export type AuditLog = typeof auditLog.$inferSelect
export type FeaturedProject = typeof featuredProject.$inferSelect
export type FeaturedGallery = typeof featuredGallery.$inferSelect
export type Config = typeof config.$inferSelect
export type Follow = typeof follow.$inferSelect
export type Notification = typeof notification.$inferSelect
