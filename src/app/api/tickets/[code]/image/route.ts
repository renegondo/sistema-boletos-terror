import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { generateTicketPngBuffer, generateTicketSvg } from '@/lib/ticket-generator';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'png';
    const cleanCode = code.toUpperCase().trim();

    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*, events(title, event_date, event_time, location), ticket_tiers(name), orders(id)')
      .or(`ticket_code.eq.${cleanCode},id.eq.${cleanCode}`)
      .single();

    if (error || !ticket) {
      return new NextResponse('Boleto no encontrado', { status: 404 });
    }

    const event = ticket.events;
    const tier = ticket.ticket_tiers;

    const ticketData = {
      ticketCode: ticket.ticket_code,
      eventTitle: event?.title || 'Horror Fest 2026',
      eventDate: event?.event_date || '2026-11-01',
      eventTime: event?.event_time || '21:00',
      location: event?.location || 'Salón del Sindicato del IMSS',
      tierName: tier?.name || 'Boleto Oficial',
      price: Number(ticket.price) || 150,
      attendeeName: ticket.attendee_name,
      orderId: ticket.order_id,
    };

    if (format === 'svg') {
      const svg = await generateTicketSvg(ticketData);
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const pngBuffer = await generateTicketPngBuffer(ticketData);
    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `inline; filename="Boleto-${ticket.ticket_code}.png"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating ticket image:', error);
    return new NextResponse('Error al renderizar el boleto', { status: 500 });
  }
}
