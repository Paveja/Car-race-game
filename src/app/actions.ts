'use server';

import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db, schema } from '@/db';
import { recordAudit } from '@/lib/audit';
import { createSession, destroySession, requireAdministrator } from '@/lib/auth';
import { verifyPassword } from '@/lib/password';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const roleSchema = z.enum(['administrator', 'viewer']);

export async function signIn(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) redirect('/login?error=invalid');

  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, parsed.data.email.toLowerCase()))
    .get();
  if (!user || !user.active || !verifyPassword(parsed.data.password, user.passwordHash)) {
    if (user) recordAudit({ actorId: user.id, action: 'sign_in', outcome: 'failure' });
    redirect('/login?error=invalid');
  }

  await createSession(user.id);
  recordAudit({ actorId: user.id, action: 'sign_in', outcome: 'success' });
  redirect('/');
}

export async function signOut() {
  await destroySession();
  redirect('/login');
}

export async function updateUserRole(formData: FormData) {
  const actor = await requireAdministrator();
  const targetId = z.string().uuid().safeParse(formData.get('userId'));
  const role = roleSchema.safeParse(formData.get('role'));
  if (!targetId.success || !role.success) redirect('/access?error=invalid');

  const target = db.select().from(schema.users).where(eq(schema.users.id, targetId.data)).get();
  if (!target) redirect('/access?error=missing');
  if (target.id === actor.id && role.data !== 'administrator') redirect('/access?error=self');

  db.update(schema.users)
    .set({ role: role.data, updatedAt: new Date() })
    .where(eq(schema.users.id, target.id))
    .run();
  recordAudit({
    actorId: actor.id,
    action: 'change_role',
    targetId: target.id,
    metadata: { from: target.role, to: role.data },
    outcome: 'success',
  });
  redirect('/access?updated=1');
}

export async function updateUserStatus(formData: FormData) {
  const actor = await requireAdministrator();
  const targetId = z.string().uuid().safeParse(formData.get('userId'));
  const active = z.enum(['true', 'false']).safeParse(formData.get('active'));
  if (!targetId.success || !active.success) redirect('/access?error=invalid');

  const target = db.select().from(schema.users).where(eq(schema.users.id, targetId.data)).get();
  if (!target) redirect('/access?error=missing');
  if (target.id === actor.id && active.data === 'false') redirect('/access?error=self');

  db.update(schema.users)
    .set({ active: active.data === 'true', updatedAt: new Date() })
    .where(eq(schema.users.id, target.id))
    .run();
  if (active.data === 'false') {
    db.delete(schema.sessions).where(eq(schema.sessions.userId, target.id)).run();
  }
  recordAudit({
    actorId: actor.id,
    action: active.data === 'true' ? 'activate_user' : 'deactivate_user',
    targetId: target.id,
    outcome: 'success',
  });
  redirect('/access?updated=1');
}
