import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para validar accesos' }, { status: 401 });
    }

    const { code } = await params;
    const db = getDb();

    const findStmt = db.prepare(`
      SELECT 
        t.*,
        e.title as event_title,
        tt.name as tier_name,
        o.status as order_status,
        o.id as order_id
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_tiers tt ON t.tier_id = tt.id
      JOIN orders o ON t.order_id = o.id
      WHERE t.ticket_code = ? OR t.id = ?
    `);

    const ticket = findStmt.get(code.toUpperCase().trim(), code) as any;

    if (!ticket) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Boleto inexistente o no registrado',
      }, { status: 404 });
    }

    if (ticket.order_status === 'pending') {
      return NextResponse.json({
        success: false,
        valid: false,
        status: 'pending_payment',
        message: `⚠️ BOLETO PENDIENTE DE PAGO ⚠️\nCobrar: $${ticket.price} MXN`,
        ticket,
        orderId: ticket.order_id,
      }, { status: 402 });
    }

    if (ticket.status === 'used') {
      return NextResponse.json({
        success: false,
        valid: false,
        status: 'used',
        message: `¡ALERTA! Este boleto YA FUE USADO previamente el ${new Date(ticket.used_at).toLocaleString('es-MX')}`,
        ticket,
      }, { status: 409 });
    }

    if (ticket.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        valid: false,
        status: 'cancelled',
        message: 'Este boleto fue cancelado o reembolsado',
        ticket,
      }, { status: 400 });
    }

    // Mark as used
    const now = new Date().toISOString();
    const updateStmt = db.prepare("UPDATE tickets SET status = 'used', used_at = ? WHERE id = ?");
    updateStmt.run(now, ticket.id);

    return NextResponse.json({
      success: true,
      valid: true,
      status: 'valid_and_checked_in',
      message: `¡ACCESO AUTORIZADO! Bienvenido, ${ticket.attendee_name} (${ticket.tier_name})`,
      ticket: {
        ...ticket,
        status: 'used',
        used_at: now,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al validar boleto' }, { status: 500 });
  }
}
