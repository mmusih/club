import { index, int, mysqlTable, longtext, varchar, customType, primaryKey } from 'drizzle-orm/mysql-core';
const mediumblob = customType<{ data: Buffer }>({ dataType: () => 'mediumblob' });
export const siteContent = mysqlTable('site_content', {
  id: int('id').primaryKey(), body: longtext('body').notNull(),
  version: int('version').notNull().default(1), updatedAt: varchar('updated_at', { length: 32 }).notNull(),
});
export const players = mysqlTable('players', {
  id: varchar('id', { length: 36 }).primaryKey(), body: longtext('body').notNull(),
  status: varchar('status', { length: 16 }).notNull().default('draft'),
  version: int('version').notNull().default(1), updatedAt: varchar('updated_at', { length: 32 }).notNull(),
}, t => [index('idx_players_status').on(t.status)]);
export const media = mysqlTable('media', {
  id: varchar('id', { length: 64 }).primaryKey(), contentType: varchar('content_type', { length: 32 }).notNull(),
  body: mediumblob('body').notNull(),
});
export const mediaChunks = mysqlTable('media_chunks', {
  mediaId: varchar('media_id', { length: 64 }).notNull().references(() => media.id, { onDelete: 'cascade' }),
  sequence: int('sequence').notNull(), body: mediumblob('body').notNull(),
}, t => [primaryKey({ columns: [t.mediaId, t.sequence] })]);
export const sessions = mysqlTable('admin_sessions', {
  tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
  email: varchar('email', { length: 254 }).notNull(),
  credentialVersion: varchar('credential_version', { length: 64 }).notNull(),
  expiresAt: varchar('expires_at', { length: 32 }).notNull(),
});
export const loginAttempts = mysqlTable('login_attempts', {
  id: varchar('id', { length: 64 }).primaryKey(), attempts: int('attempts').notNull(),
  resetAt: varchar('reset_at', { length: 32 }).notNull(),
});
