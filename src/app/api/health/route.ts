import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';

export async function GET() {
  try {
    db.get<{ ok: number }>(sql`select 1 as ok`);
    return NextResponse.json({ status: 'ok', service: 'control-room', database: 'ok' });
  } catch (error) {
    console.error('Health check failed', error);
    return NextResponse.json(
      { status: 'degraded', service: 'control-room', database: 'error' },
      { status: 503 }
    );
  }
}
