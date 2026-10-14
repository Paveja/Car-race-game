import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';

export function listUsers() {
  return db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      active: schema.users.active,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .all();
}

export function countByRole(role: 'administrator' | 'viewer') {
  return db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.role, role))
    .all().length;
}
