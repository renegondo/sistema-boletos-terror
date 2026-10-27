import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const cleanCode = code.toUpperCase().trim();

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, events(title, event_date, event_time, location), ticket_tiers(name), orders(customer_name, customer_phone, users(name))')
      .or(`ticket_code.eq.${cleanCode},id.eq.${cleanCode}`)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: 'Boleto no encontrado' }, { status: 404 });
    }

    const event = ticket.events;
    const tier = ticket.ticket_tiers;
    const order = ticket.orders;
    const vendor = order?.users;

    const formattedTicket = {
      ...ticket,
      event_title: event?.title || 'Horror Fest',
      event_date: event?.event_date || '2026-11-01',
      event_time: event?.event_time || '21:00',
      event_location: event?.location || 'Salón del Sindicato del IMSS',
      tier_name: tier?.name || 'Boleto',
      customer_name: order?.customer_name || ticket.attendee_name,
      customer_phone: order?.customer_phone || '',
      vendor_name: vendor?.name || 'Venta Online',
    };

    return NextResponse.json({ ticket: formattedTicket });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al consultar boleto' }, { status: 500 });
  }
}
