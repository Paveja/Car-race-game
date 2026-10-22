import { z } from 'zod';

export const createOrderSchema = z.object({
  productId: z.string().min(1, 'Choose a product.'),
  quantity: z.coerce.number().int('Quantity must be a whole number.').min(1, 'Quantity must be at least 1.').max(10, 'Quantity cannot exceed 10.'),
  customerName: z.string().trim().min(2, 'Enter your full name.').max(100, 'Name is too long.'),
  email: z.string().trim().email('Enter a valid email address.'),
  shippingAddress: z.string().trim().min(10, 'Enter a complete shipping address.').max(300, 'Address is too long.'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const ORDER_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function getSafeErrorMessage(code: string | null): string | null {
  const messages: Record<string, string> = {
    payment_declined: 'Payment authorization was declined. Check your details and try again.',
    inventory_unavailable: 'This item is no longer available in the requested quantity.',
    transient_payment: 'Payment is taking longer than expected. We will keep trying.',
    task_exhausted: 'We could not complete this order after several attempts.',
  };
  return code ? (messages[code] ?? 'We could not complete this order.') : null;
}
