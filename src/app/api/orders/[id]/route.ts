import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orderTasks, orders, products } from '@/db/schema';
import { getAuthenticatedUserId } from '@/lib/auth';
import { getSafeErrorMessage } from '@/lib/order-contract';
import { startWorker } from '@/lib/worker';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });

  const { id } = await params;
  const result = db.select({
    order: orders,
    task: orderTasks,
    productName: products.name,
  }).from(orders)
    .innerJoin(orderTasks, eq(orderTasks.orderId, orders.id))
    .innerJoin(products, eq(products.id, orders.productId))
    .where(and(eq(orders.id, id), eq(orders.userId, userId)))
    .get();

  if (!result) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  startWorker();
  return NextResponse.json({
    orderId: result.order.id,
    status: result.order.status,
    productName: result.productName,
    quantity: result.order.quantity,
    task: {
      status: result.task.status,
      attempts: result.task.attempts,
      maxAttempts: result.task.maxAttempts,
      nextAttemptAt: result.task.nextAttemptAt,
      lastErrorCode: result.task.lastErrorCode,
    },
    failure: result.order.status === 'failed' ? {
      code: result.order.failureCode,
      message: getSafeErrorMessage(result.order.failureCode),
    } : null,
    createdAt: result.order.createdAt,
    updatedAt: result.order.updatedAt,
  });
}
