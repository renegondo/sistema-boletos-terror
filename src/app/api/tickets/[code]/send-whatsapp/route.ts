import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateTicketPngBase64 } from '@/lib/ticket-generator';
import { sendTicketViaWhatsApp } from '@/lib/evolution';

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

    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        t.*,
        e.title as event_title,
        e.event_date,
        e.event_time,
        e.location as event_location,
        tt.name as tier_name,
        o.customer_phone,
        o.id as order_id
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_tiers tt ON t.tier_id = tt.id
      JOIN orders o ON t.order_id = o.id
      WHERE t.ticket_code = ? OR t.id = ?
    `);

    const ticket = stmt.get(code.toUpperCase().trim(), code) as any;

    if (!ticket) {
      return NextResponse.json({ error: 'Boleto no encontrado' }, { status: 404 });
    }

    const targetPhone = customPhone || ticket.customer_phone;

    let imageToSend = clientImage;
    if (!imageToSend) {
      imageToSend = await generateTicketPngBase64({
        ticketCode: ticket.ticket_code,
        eventTitle: ticket.event_title,
        eventDate: ticket.event_date,
        eventTime: ticket.event_time,
        location: ticket.event_location,
        tierName: ticket.tier_name,
        price: ticket.price,
        attendeeName: ticket.attendee_name,
        orderId: ticket.order_id,
      });
    }

    const result = await sendTicketViaWhatsApp({
      phone: targetPhone,
      ticketCode: ticket.ticket_code,
      attendeeName: ticket.attendee_name,
      eventTitle: ticket.event_title,
      eventDate: ticket.event_date,
      eventTime: ticket.event_time,
      location: ticket.event_location,
      tierName: ticket.tier_name,
      price: ticket.price,
      imageBase64OrUrl: imageToSend,
    });

    if (result.success) {
      // Update order status
      const updateOrder = db.prepare("UPDATE orders SET whatsapp_status = 'sent', whatsapp_error = NULL WHERE id = ?");
      updateOrder.run(ticket.order_id);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al enviar por WhatsApp' }, { status: 500 });
  }
}
