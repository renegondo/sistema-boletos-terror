import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'node:crypto';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden registrar liquidaciones' }, { status: 403 });
    }

    const body = await request.json();
    const { vendor_id, amount, notes } = body;

    if (!vendor_id || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Vendedor y monto válido requeridos' }, { status: 400 });
    }

    const db = getDb();
    const payoutId = `pay_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO commission_payouts (id, vendor_id, amount, notes, paid_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insert.run(payoutId, vendor_id, Number(amount), notes?.trim() || null, now, user.name);

    return NextResponse.json({
      success: true,
      message: 'Liquidación de comisión registrada exitosamente',
      payoutId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al registrar liquidación' }, { status: 500 });
  }
}
