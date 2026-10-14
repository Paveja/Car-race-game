import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db';

export function recordAudit(input: {
  actorId: string;
  action: string;
  targetId?: string;
  metadata?: Record<string, string | boolean | null>;
  outcome: 'success' | 'failure';
}) {
  db.insert(schema.auditEvents)
    .values({
      id: randomUUID(),
      actorId: input.actorId,
      action: input.action,
      targetId: input.targetId ?? null,
      metadata: JSON.stringify(input.metadata ?? {}),
      outcome: input.outcome,
      createdAt: new Date(),
    })
    .run();
}

export function listRecentAudit(limit = 20) {
  return db
    .select({ event: schema.auditEvents, actor: schema.users })
    .from(schema.auditEvents)
    .innerJoin(schema.users, eq(schema.auditEvents.actorId, schema.users.id))
    .orderBy(desc(schema.auditEvents.createdAt))
    .limit(limit)
    .all();
}
