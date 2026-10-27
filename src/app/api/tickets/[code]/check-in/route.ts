import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
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
    const cleanCode = code.toUpperCase().trim();

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, events(title), ticket_tiers(name), orders(id, status)')
      .or(`ticket_code.eq.${cleanCode},id.eq.${cleanCode}`)
      .single();

    if (error || !ticket) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Boleto inexistente o no registrado',
      }, { status: 404 });
    }

    const order = ticket.orders;
    if (order?.status === 'pending') {
      return NextResponse.json({
        success: false,
        valid: false,
        status: 'pending_payment',
        message: `⚠️ BOLETO PENDIENTE DE PAGO ⚠️\nCobrar: $${ticket.price} MXN`,
        ticket,
        orderId: order.id,
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
        message: 'Este boleto está CANCELADO o revocado',
        ticket,
      }, { status: 410 });
    }

    const now = new Date().toISOString();
    await supabase
      .from('tickets')
      .update({ status: 'used', used_at: now })
      .eq('id', ticket.id);

    return NextResponse.json({
      success: true,
      valid: true,
      status: 'valid_checked_in',
      message: '✅ ACCESO AUTORIZADO - Bienvenido a Horror Fest 2026',
      ticket: {
        ...ticket,
        status: 'used',
        used_at: now,
        validator_name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Error checking in ticket:', error);
    return NextResponse.json({ error: error.message || 'Error al validar boleto' }, { status: 500 });
  }
}
