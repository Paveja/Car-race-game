import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { products } from './schema';
import { db } from './index';

const seededProducts = [
  {
    id: 'prod_canvas_pack',
    sku: 'canvas-pack',
    name: 'Field Canvas Pack',
    description: 'A durable everyday carry with a padded laptop sleeve.',
    priceCents: 8900,
    inventoryAvailable: 24,
  },
  {
    id: 'prod_retry_demo',
    sku: 'retry-demo',
    name: 'Retry Test Pack',
    description: 'A seeded item used to exercise transient processing recovery.',
    priceCents: 4200,
    inventoryAvailable: 10,
  },
  {
    id: 'prod_fail_demo',
    sku: 'fail-payment-demo',
    name: 'Payment Failure Test Pack',
    description: 'A seeded item used to exercise permanent payment failures.',
    priceCents: 3100,
    inventoryAvailable: 10,
  },
];

for (const product of seededProducts) {
  db.insert(products)
    .values({ ...product, createdAt: new Date() })
    .onConflictDoUpdate({
      target: products.id,
      set: {
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        inventoryAvailable: product.inventoryAvailable,
      },
    })
    .run();
}

console.log(JSON.stringify({ event: 'seed_complete', productCount: seededProducts.length, seedId: randomUUID() }));
