import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateTicketPngBase64 } from '@/lib/ticket-generator';
import { sendTicketViaWhatsApp } from '@/lib/evolution';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { code } = await params;
    const body = await request.json().catch(() => ({}));
    const customPhone = body?.phone;
    const clientImage = body?.image;
    const cleanCode = code.toUpperCase().trim();

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, events(title, event_date, event_time, location), ticket_tiers(name), orders(customer_phone, id)')
      .or(`ticket_code.eq.${cleanCode},id.eq.${cleanCode}`)
      .single();

    if (error || !ticket) {
      return NextResponse.json({ error: 'Boleto no encontrado' }, { status: 404 });
    }

    const event = ticket.events;
    const tier = ticket.ticket_tiers;
    const order = ticket.orders;
    const targetPhone = customPhone || order?.customer_phone;

    let imageToSend = clientImage;
    if (!imageToSend) {
      imageToSend = await generateTicketPngBase64({
        ticketCode: ticket.ticket_code,
        eventTitle: event?.title || 'Horror Fest 2026',
        eventDate: event?.event_date || '2026-11-01',
        eventTime: event?.event_time || '21:00',
        location: event?.location || 'Salón del Sindicato del IMSS',
        tierName: tier?.name || 'Boleto General',
        price: Number(ticket.price) || 150,
        attendeeName: ticket.attendee_name,
        orderId: ticket.order_id,
      });
    }

    const result = await sendTicketViaWhatsApp({
      phone: targetPhone,
      attendeeName: ticket.attendee_name,
      eventTitle: event?.title || 'Horror Fest 2026',
      eventDate: event?.event_date || '2026-11-01',
      eventTime: event?.event_time || '21:00',
      location: event?.location || 'Salón del Sindicato del IMSS',
      ticketCode: ticket.ticket_code,
      tierName: tier?.name || 'Boleto General',
      price: Number(ticket.price) || 150,
      imageBase64OrUrl: imageToSend,
    });

    return NextResponse.json({
      success: true,
      message: 'Boleto enviado por WhatsApp exitosamente',
      phone: targetPhone,
      result,
    });
  } catch (error: any) {
    console.error('Error sending ticket via WhatsApp:', error);
    return NextResponse.json({ error: error.message || 'Error al enviar boleto' }, { status: 500 });
  }
}
