import { createHash, randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orderTasks, orders, products } from '@/db/schema';
import { getAuthenticatedUserId } from '@/lib/auth';
import { logError, logEvent } from '@/lib/logger';
import { createOrderSchema } from '@/lib/order-contract';
import { startWorker } from '@/lib/worker';

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });

  const idempotencyKey = request.headers.get('idempotency-key')?.trim();
  if (!idempotencyKey || idempotencyKey.length > 200) {
    return NextResponse.json({ error: 'A valid Idempotency-Key header is required.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Please correct the highlighted fields.',
      fields: parsed.error.flatten().fieldErrors,
    }, { status: 400 });
  }

  const requestFingerprint = createHash('sha256').update(JSON.stringify(parsed.data)).digest('hex');
  const existing = db.select().from(orders).where(and(
    eq(orders.userId, userId),
    eq(orders.idempotencyKey, idempotencyKey),
  )).get();
  if (existing) {
    if (existing.requestFingerprint !== requestFingerprint) {
      return NextResponse.json({ error: 'This idempotency key was already used for a different order.' }, { status: 409 });
    }
    return NextResponse.json({ orderId: existing.id, status: existing.status }, { status: 202 });
  }

  const product = db.select().from(products).where(eq(products.id, parsed.data.productId)).get();
  if (!product) {
    return NextResponse.json({ error: 'Choose an available product.' }, { status: 400 });
  }

  const now = new Date();
  const orderId = randomUUID();
  const taskId = randomUUID();
  try {
    db.transaction((tx) => {
      tx.insert(orders).values({
        id: orderId,
        userId,
        idempotencyKey,
        requestFingerprint,
        productId: product.id,
        quantity: parsed.data.quantity,
        customerName: parsed.data.customerName,
        email: parsed.data.email,
        shippingAddress: parsed.data.shippingAddress,
        status: 'pending',
        failureCode: null,
        failureMessage: null,
        createdAt: now,
        updatedAt: now,
      }).run();
      tx.insert(orderTasks).values({
        id: taskId,
        orderId,
        status: 'pending',
        attempts: 0,
        maxAttempts: 5,
        nextAttemptAt: now,
        leaseUntil: null,
        lastErrorCode: null,
        lastErrorMessage: null,
        createdAt: now,
        updatedAt: now,
      }).run();
    });
  } catch (error) {
    logError('order_create_failed', error, { userId });
    return NextResponse.json({ error: 'We could not create your order. Please try again.' }, { status: 500 });
  }

  startWorker();
  logEvent('order_created', { orderId, taskId, userId });
  return NextResponse.json({ orderId, status: 'pending' }, { status: 202 });
}
