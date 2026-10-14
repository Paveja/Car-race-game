import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db, schema } from './index';
import { hashPassword } from '../lib/password';

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const viewerPassword = process.env.SEED_VIEWER_PASSWORD;
  if (!adminPassword || !viewerPassword) {
    throw new Error(
      'SEED_ADMIN_PASSWORD and SEED_VIEWER_PASSWORD are required to seed local users.'
    );
  }

  const now = new Date();
  const users = [
    {
      id: randomUUID(),
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@controlroom.local',
      name: 'Avery Chen',
      role: 'administrator' as const,
      active: true,
      passwordHash: hashPassword(adminPassword),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      email: process.env.SEED_VIEWER_EMAIL ?? 'viewer@controlroom.local',
      name: 'Morgan Ellis',
      role: 'viewer' as const,
      active: true,
      passwordHash: hashPassword(viewerPassword),
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const user of users) {
    const existing = db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, user.email))
      .get();
    if (!existing) db.insert(schema.users).values(user).run();
  }

  console.log('Seeded administrator and viewer accounts.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
