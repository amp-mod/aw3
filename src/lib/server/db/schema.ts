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
		pfp: text(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),

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
