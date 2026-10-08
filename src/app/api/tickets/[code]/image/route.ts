import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateTicketPngBuffer, generateTicketSvg } from '@/lib/ticket-generator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'png';

    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        t.*,
        e.title as event_title,
        e.event_date,
        e.event_time,
        e.location as event_location,
        tt.name as tier_name,
        o.id as order_id
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_tiers tt ON t.tier_id = tt.id
      JOIN orders o ON t.order_id = o.id
      WHERE t.ticket_code = ? OR t.id = ?
    `);

    const ticket = stmt.get(code.toUpperCase().trim(), code) as any;

    if (!ticket) {
      return new NextResponse('Boleto no encontrado', { status: 404 });
    }

    const ticketData = {
      ticketCode: ticket.ticket_code,
      eventTitle: ticket.event_title,
      eventDate: ticket.event_date,
      eventTime: ticket.event_time,
      location: ticket.event_location,
      tierName: ticket.tier_name,
      price: ticket.price,
      attendeeName: ticket.attendee_name,
      orderId: ticket.order_id,
    };

    if (format === 'svg') {
      const svg = await generateTicketSvg(ticketData);
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    // Default to real high-resolution PNG
    const pngBuffer = await generateTicketPngBuffer(ticketData);
    return new NextResponse(pngBuffer as any, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="boleto-${ticket.ticket_code}.png"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    return new NextResponse(`Error generando boleto: ${error.message}`, { status: 500 });
  }
}
