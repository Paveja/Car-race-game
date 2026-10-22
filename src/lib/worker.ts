import { randomUUID } from 'node:crypto';
import { and, eq, lte, or } from 'drizzle-orm';
import { db } from '@/db';
import { inventoryReservations, orderTasks, orders, paymentOperations, products, taskAttempts } from '@/db/schema';
import { logError, logEvent } from './logger';

const POLL_MS = 500;
const LEASE_MS = 30_000;
const MAX_ATTEMPTS = 5;

class TaskError extends Error {
  constructor(
    public readonly code: string,
    public readonly retryable: boolean,
    message: string,
  ) {
    super(message);
  }
}

let workerStarted = false;

export function startWorker() {
  if (workerStarted) return;
  workerStarted = true;
  void poll();
  logEvent('worker_started', { pollMs: POLL_MS });
}

async function poll() {
  try {
    await processDueTask();
  } catch (error) {
    logError('worker_poll_failed', error);
  } finally {
    setTimeout(() => void poll(), POLL_MS);
  }
}

export async function processDueTask(now = new Date()): Promise<boolean> {
  const task = db
    .select()
    .from(orderTasks)
    .where(
      or(
        and(eq(orderTasks.status, 'pending'), lte(orderTasks.nextAttemptAt, now)),
        and(eq(orderTasks.status, 'processing'), lte(orderTasks.leaseUntil!, now)),
      ),
    )
    .limit(1)
    .get();

  if (!task) return false;

  const claimed = db
    .update(orderTasks)
    .set({ status: 'processing', leaseUntil: new Date(Date.now() + LEASE_MS), updatedAt: now })
    .where(eq(orderTasks.id, task.id))
    .run();

  if (claimed.changes !== 1) return false;

  const order = db.select().from(orders).where(eq(orders.id, task.orderId)).get();
  if (!order) {
    logError('worker_order_missing', new Error('Order not found'), { taskId: task.id, orderId: task.orderId });
    return false;
  }

  const attemptNumber = task.attempts + 1;
  const attemptId = randomUUID();
  db.insert(taskAttempts).values({
    id: attemptId,
    taskId: task.id,
    attemptNumber,
    status: 'processing',
    startedAt: now,
  }).run();
  db.update(orderTasks).set({ attempts: attemptNumber, updatedAt: now }).where(eq(orderTasks.id, task.id)).run();
  db.update(orders).set({ status: 'processing', updatedAt: now }).where(eq(orders.id)).run();

  logEvent('order_processing_started', { taskId: task.id, orderId: order.id, attempt: attemptNumber });

  try {
    processOperations(order, attemptNumber);
    const completedAt = new Date();
    db.transaction((tx) => {
      tx.update(orderTasks).set({ status: 'completed', leaseUntil: null, updatedAt: completedAt }).where(eq(orderTasks.id, task.id)).run();
      tx.update(taskAttempts).set({ status: 'completed', finishedAt: completedAt }).where(eq(taskAttempts.id, attemptId)).run();
      tx.update(orders).set({ status: 'completed', updatedAt: completedAt }).where(eq(orders.id, order.id)).run();
    });
    logEvent('order_processing_completed', { taskId: task.id, orderId: order.id, attempt: attemptNumber });
  } catch (error) {
    const taskError = error instanceof TaskError
      ? error
      : new TaskError('unknown_failure', false, 'Unexpected processing failure.');
    const exhausted = !taskError.retryable || attemptNumber >= MAX_ATTEMPTS;
    const finishedAt = new Date();
    const nextAttemptAt = new Date(Date.now() + Math.min(60_000, 1_000 * 2 ** (attemptNumber - 1)));
    db.transaction((tx) => {
      tx.update(taskAttempts).set({
        status: exhausted ? 'failed' : 'retrying',
        errorCode: taskError.code,
        errorMessage: taskError.message,
        finishedAt,
      }).where(eq(taskAttempts.id, attemptId)).run();
      tx.update(orderTasks).set({
        status: exhausted ? 'failed' : 'pending',
        leaseUntil: null,
        nextAttemptAt: exhausted ? finishedAt : nextAttemptAt,
        lastErrorCode: exhausted ? 'task_exhausted' : taskError.code,
        lastErrorMessage: taskError.message,
        updatedAt: finishedAt,
      }).where(eq(orderTasks.id, task.id)).run();
      tx.update(orders).set({
        status: exhausted ? 'failed' : 'processing',
        failureCode: exhausted ? 'task_exhausted' : taskError.code,
        failureMessage: exhausted ? taskError.message : null,
        updatedAt: finishedAt,
      }).where(eq(orders.id, order.id)).run();
    });
    logError(exhausted ? 'order_processing_failed' : 'order_processing_retry_scheduled', error, {
      taskId: task.id,
      orderId: order.id,
      attempt: attemptNumber,
      retryAt: exhausted ? null : nextAttemptAt.toISOString(),
    });
  }

  return true;
}

function processOperations(order: typeof orders.$inferSelect, attemptNumber: number) {
  const product = db.select().from(products).where(eq(products.id, order.productId)).get();
  if (!product) throw new TaskError('product_missing', false, 'Product is no longer available.');

  const paymentKey = `payment:${order.id}`;
  const existingPayment = db.select().from(paymentOperations).where(eq(paymentOperations.idempotencyKey, paymentKey)).get();
  if (!existingPayment) {
    if (product.sku === 'fail-payment-demo') {
      throw new TaskError('payment_declined', false, 'Payment authorization was declined.');
    }
    if (product.sku === 'retry-demo' && attemptNumber < 3) {
      throw new TaskError('transient_payment', true, 'Payment provider timed out.');
    }
    db.insert(paymentOperations).values({
      id: randomUUID(),
      orderId: order.id,
      idempotencyKey: paymentKey,
      status: 'authorized',
      createdAt: new Date(),
    }).run();
  }

  const inventoryKey = `inventory:${order.id}`;
  const existingReservation = db.select().from(inventoryReservations).where(eq(inventoryReservations.idempotencyKey, inventoryKey)).get();
  if (existingReservation?.status === 'reserved') return;
  if (product.inventoryAvailable < order.quantity) {
    throw new TaskError('inventory_unavailable', false, 'Insufficient inventory.');
  }

  db.transaction((tx) => {
    tx.update(products)
      .set({ inventoryAvailable: product.inventoryAvailable - order.quantity })
      .where(eq(products.id, product.id))
      .run();
    tx.insert(inventoryReservations).values({
      id: randomUUID(),
      orderId: order.id,
      productId: product.id,
      idempotencyKey: inventoryKey,
      quantity: order.quantity,
      status: 'reserved',
      createdAt: new Date(),
    }).run();
  });
}

export function resetWorkerForTests() {
  workerStarted = false;
}

export const workerConfig = { MAX_ATTEMPTS, POLL_MS };
