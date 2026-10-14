import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: text('role', { enum: ['administrator', 'viewer'] }).notNull(),
    active: integer('active', { mode: 'boolean' }).notNull().default(true),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('users_email_idx').on(table.email)]
);

export const sessions = sqliteTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [index('sessions_user_idx').on(table.userId)]
);

export const auditEvents = sqliteTable(
  'audit_events',
  {
    id: text('id').primaryKey(),
    actorId: text('actor_id')
      .notNull()
      .references(() => users.id),
    action: text('action').notNull(),
    targetId: text('target_id'),
    metadata: text('metadata').notNull().default('{}'),
    outcome: text('outcome', { enum: ['success', 'failure'] }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => [
    index('audit_created_idx').on(table.createdAt),
    index('audit_actor_idx').on(table.actorId),
    index('audit_target_idx').on(table.targetId),
  ]
);

export type User = typeof users.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
