import { pgTable, text, timestamp, boolean, varchar, smallint, json } from 'drizzle-orm/pg-core';

export const user = pgTable('ampmodder', {
  id: text('user_id').primaryKey(),
  username: varchar('username', { length: 20 }).notNull().unique(),
  joined: timestamp('joined', { mode: 'date' }).defaultNow().notNull(),
  rank: smallint('rank').default(0), // 0 = New AmpModder
  bio: text('bio'),
  status: text('status'),
  passwordHash: text('password_hash').notNull(),
  banned: boolean('banned').default(false),
  bannedType: text('bannedType').default('temporary'),
  bannedReason: text('bannedReason').default('You have been banned for breaking the guidelines.'), // Mods should change this
  bannedExpiry: timestamp('bannedExpiry', { mode: 'date' }).defaultNow().notNull(),
  ghost: boolean('ghost').default(false) // ghost = whether account profile is accessible
});

export const project = pgTable('project', {
  // TODO: add remixing
  id: text('id').primaryKey(),
  title: varchar('title', { length: 500 }),
  created: timestamp('created', { mode: 'date' }).defaultNow().notNull(),
  instructions: text('instructions'),
  notes: text('notes'),
  creator: text('creator')
    .notNull()
    .references(() => user.id),
  ghost: boolean('ghost').default(true),
  projectJson: json('projectJson')
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Project = typeof project.$inferSelect;
