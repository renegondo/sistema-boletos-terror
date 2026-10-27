import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
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

    const payoutId = `pay_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    const { error } = await supabase.from('commission_payouts').insert({
      id: payoutId,
      vendor_id,
      amount: Number(amount),
      notes: notes?.trim() || null,
      paid_at: now,
      created_by: user.name,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Liquidación de comisión registrada exitosamente',
      payoutId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al registrar liquidación' }, { status: 500 });
  }
}
