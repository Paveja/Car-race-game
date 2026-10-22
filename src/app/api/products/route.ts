import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { products } from '@/db/schema';
import { logError } from '@/lib/logger';

export async function GET() {
  try {
    const availableProducts = db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      priceCents: products.priceCents,
      inventoryAvailable: products.inventoryAvailable,
    }).from(products).orderBy(asc(products.name)).all();
    return NextResponse.json({ products: availableProducts });
  } catch (error) {
    logError('products_fetch_failed', error);
    return NextResponse.json({ error: 'Products are temporarily unavailable.' }, { status: 500 });
  }
}
