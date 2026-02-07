import { pgTable, smallint, text, timestamp, varchar, index, boolean } from 'drizzle-orm/pg-core'

export const user = pgTable(
	'user',
	{
		id: text('id').primaryKey(),
		username: text('username').notNull().unique(),
		passwordHash: text('password_hash').notNull(),
		bio: varchar({ length: 2000 }).default(''),
		/*
         0 = new ampmodder
         1 = ampmodder
         2 = moderator
         3 = operator

         we most likely won't expand the number of ranks anytime soon,
         which is why this is a smallint
      */
		rank: smallint('rank').default(0),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
		// welcome to the banlands
		status: text('status').default('normal'),
		bannedExpiry: timestamp('banned_expiry', { withTimezone: true, mode: 'date' }).defaultNow(),
		banReason: text('ban_reason'),
	},
	(table) => [index('username_idx').on(table.username)],
)

export const session = pgTable(
	'session',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
	},
	(table) => [index('user_id_idx').on(table.userId)],
)

export type Session = typeof session.$inferSelect
export type User = typeof user.$inferSelect
