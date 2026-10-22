import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  priceCents: integer('price_cents').notNull(),
  inventoryAvailable: integer('inventory_available').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    requestFingerprint: text('request_fingerprint').notNull(),
    productId: text('product_id').notNull().references(() => products.id),
    quantity: integer('quantity').notNull(),
    customerName: text('customer_name').notNull(),
    email: text('email').notNull(),
    shippingAddress: text('shipping_address').notNull(),
    status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull(),
    failureCode: text('failure_code'),
    failureMessage: text('failure_message'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    userIdempotencyUnique: uniqueIndex('orders_user_idempotency_unique').on(
      table.userId,
      table.idempotencyKey,
    ),
  }),
);

export const orderTasks = sqliteTable('order_tasks', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(5),
  nextAttemptAt: integer('next_attempt_at', { mode: 'timestamp_ms' }).notNull(),
  leaseUntil: integer('lease_until', { mode: 'timestamp_ms' }),
  lastErrorCode: text('last_error_code'),
  lastErrorMessage: text('last_error_message'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const taskAttempts = sqliteTable('task_attempts', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => orderTasks.id),
  attemptNumber: integer('attempt_number').notNull(),
  status: text('status', { enum: ['processing', 'completed', 'retrying', 'failed'] }).notNull(),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
});

export const paymentOperations = sqliteTable(
  'payment_operations',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id').notNull().references(() => orders.id),
    idempotencyKey: text('idempotency_key').notNull(),
    status: text('status', { enum: ['authorized', 'failed'] }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    idempotencyUnique: uniqueIndex('payment_operations_key_unique').on(table.idempotencyKey),
  }),
);

export const inventoryReservations = sqliteTable(
  'inventory_reservations',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id').notNull().references(() => orders.id),
    productId: text('product_id').notNull().references(() => products.id),
    idempotencyKey: text('idempotency_key').notNull(),
    quantity: integer('quantity').notNull(),
    status: text('status', { enum: ['reserved', 'released'] }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (table) => ({
    idempotencyUnique: uniqueIndex('inventory_reservations_key_unique').on(table.idempotencyKey),
  }),
);

export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderTask = typeof orderTasks.$inferSelect;
