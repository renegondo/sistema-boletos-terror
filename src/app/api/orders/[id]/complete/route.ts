import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { generateTicketPngBase64 } from '@/lib/ticket-generator';
import { sendTicketViaWhatsApp, getEvolutionConfig } from '@/lib/evolution';
import crypto from 'node:crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (order.status === 'completed') {
      const { data: existingTickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('order_id', id);

      return NextResponse.json({
        success: true,
        message: 'La orden ya estaba marcada como completada',
        order,
        tickets: existingTickets || [],
      });
    }

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', order.event_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Evento asociado no encontrado' }, { status: 404 });
    }

    let tierId = 'tier_terror_001';
    let quantity = 1;
    let tierName = 'Cover General BYOB (Preventa Etapa 1)';
    let unitPrice = 150;

    if (order.notes) {
      try {
        const parsed = JSON.parse(order.notes);
        if (parsed.tier_id) tierId = parsed.tier_id;
        if (parsed.quantity) quantity = Number(parsed.quantity) || 1;
        if (parsed.tier_name) tierName = parsed.tier_name;
        if (parsed.price_unit) unitPrice = Number(parsed.price_unit) || 150;
      } catch {}
    }

    const { data: dbTier } = await supabase
      .from('ticket_tiers')
      .select('*')
      .eq('id', tierId)
      .single();

    if (dbTier) {
      tierName = dbTier.name;
      unitPrice = Number(dbTier.price);
    }

    // Check if tickets exist or generate them
    const { data: existingTickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('order_id', id);

    let createdTickets = existingTickets || [];

    if (createdTickets.length === 0) {
      const newTickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticketId = `tkt_${Date.now()}_${i}_${crypto.randomBytes(3).toString('hex')}`;
        const codeSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        const ticketCode = `HF26-${codeSuffix}`;
        const qrData = JSON.stringify({
          code: ticketCode,
          event: event.title,
          attendee: order.customer_name,
          order: order.id,
        });

        newTickets.push({
          id: ticketId,
          ticket_code: ticketCode,
          order_id: order.id,
          tier_id: tierId,
          event_id: order.event_id,
          attendee_name: order.customer_name,
          price: unitPrice,
          qr_data: qrData,
          status: 'valid',
        });
      }

      const { data: inserted, error: insertError } = await supabase
        .from('tickets')
        .insert(newTickets)
        .select();

      if (insertError) throw insertError;
      createdTickets = inserted || [];
    }

    // Update order status to completed
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', id);

    // Update sold_count in tier
    if (dbTier) {
      await supabase
        .from('ticket_tiers')
        .update({ sold_count: (Number(dbTier.sold_count) || 0) + quantity })
        .eq('id', tierId);
    }

    // Dispatch WhatsApp tickets asynchronously
    const evoConfig = getEvolutionConfig();
    let whatsappDispatched = false;

    if (evoConfig.autoSend) {
      (async () => {
        try {
          for (const tkt of createdTickets) {
            const pngBase64 = await generateTicketPngBase64({
              ticketCode: tkt.ticket_code,
              eventTitle: event.title,
              eventDate: event.event_date,
              eventTime: event.event_time,
              location: event.location,
              tierName: tierName,
              price: tkt.price,
              attendeeName: tkt.attendee_name,
              orderId: order.id,
            });

            await sendTicketViaWhatsApp({
              phone: order.customer_phone,
              attendeeName: order.customer_name,
              eventTitle: event.title,
              eventDate: event.event_date,
              eventTime: event.event_time,
              location: event.location,
              ticketCode: tkt.ticket_code,
              tierName: tierName,
              price: tkt.price,
              imageBase64OrUrl: pngBase64,
            });
          }

          await supabase
            .from('orders')
            .update({ whatsapp_status: 'sent', whatsapp_error: null })
            .eq('id', id);
        } catch (err: any) {
          console.error('Error dispatching WhatsApp tickets:', err);
          await supabase
            .from('orders')
            .update({ whatsapp_status: 'failed', whatsapp_error: err?.message || 'Error al enviar WhatsApp' })
            .eq('id', id);
        }
      })();
      whatsappDispatched = true;
    }

    return NextResponse.json({
      success: true,
      message: 'Orden aprobada y boletos generados correctamente',
      tickets: createdTickets,
      whatsappDispatched,
    });
  } catch (error: any) {
    console.error('Error in complete order:', error);
    return NextResponse.json({ error: error.message || 'Error al completar la orden' }, { status: 500 });
  }
}
