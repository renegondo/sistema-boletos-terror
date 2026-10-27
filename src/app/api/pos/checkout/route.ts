import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateTicketPngBase64 } from '@/lib/ticket-generator';
import { sendTicketViaWhatsApp, getEvolutionConfig } from '@/lib/evolution';
import crypto from 'node:crypto';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para realizar ventas' }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventId,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod = 'cash',
      items, // [{ tierId, quantity, attendeeNames: [] }]
      clientTicketImages = {},
    } = body;

    if (!eventId || !customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (evento, nombre, teléfono y boletos)' },
        { status: 400 }
      );
    }

    const { data: event } = await supabase.from('events').select('*').eq('id', eventId).single();
    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const { data: vendorData } = await supabase.from('users').select('*').eq('id', user.id).single();
    const vendor = vendorData || user;

    const commissionType = vendor.commission_type || 'percentage';
    const commissionRate = Number(vendor.commission_rate) || 0;

    let totalTickets = 0;
    let totalAmount = 0;
    const tierDataMap: Record<string, any> = {};

    for (const item of items) {
      const { data: tier } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('id', item.tierId)
        .eq('event_id', eventId)
        .single();

      if (!tier) {
        return NextResponse.json({ error: `Tipo de boleto no válido: ${item.tierId}` }, { status: 400 });
      }

      tierDataMap[item.tierId] = tier;
      const qty = Number(item.quantity) || 1;
      totalTickets += qty;
      totalAmount += Number(tier.price) * qty;
    }

    let vendorCommissionAmount = 0;
    if (commissionType === 'percentage') {
      vendorCommissionAmount = (totalAmount * commissionRate) / 100;
    } else {
      vendorCommissionAmount = commissionRate * totalTickets;
    }

    const orderId = `ord_pos_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const cleanPhone = customerPhone.replace(/[^\d]/g, '');

    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      event_id: eventId,
      vendor_id: user.id,
      customer_name: customerName.trim(),
      customer_phone: cleanPhone,
      customer_email: customerEmail?.trim() || null,
      payment_method: paymentMethod,
      total_amount: totalAmount,
      vendor_commission_amount: vendorCommissionAmount,
      commission_type_applied: commissionType,
      commission_rate_applied: commissionRate,
      status: 'completed',
      whatsapp_status: 'pending',
    });

    if (orderError) throw orderError;

    const createdTickets = [];
    let ticketIndex = 0;

    for (const item of items) {
      const tier = tierDataMap[item.tierId];
      const qty = Number(item.quantity) || 1;
      const attendeeNames = Array.isArray(item.attendeeNames) ? item.attendeeNames : [];

      for (let i = 0; i < qty; i++) {
        ticketIndex++;
        const ticketId = `tkt_${Date.now()}_${ticketIndex}_${crypto.randomBytes(3).toString('hex')}`;
        const codeSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        const ticketCode = `HF26-${codeSuffix}`;
        const attendee = (attendeeNames[i] && attendeeNames[i].trim()) || customerName.trim();

        const qrData = JSON.stringify({
          code: ticketCode,
          event: event.title,
          attendee,
          order: orderId,
        });

        createdTickets.push({
          id: ticketId,
          ticket_code: ticketCode,
          order_id: orderId,
          tier_id: tier.id,
          event_id: eventId,
          attendee_name: attendee,
          price: Number(tier.price),
          qr_data: qrData,
          status: 'valid',
        });
      }

      await supabase
        .from('ticket_tiers')
        .update({ sold_count: (Number(tier.sold_count) || 0) + qty })
        .eq('id', tier.id);
    }

    const { data: insertedTickets, error: tktError } = await supabase
      .from('tickets')
      .insert(createdTickets)
      .select();

    if (tktError) throw tktError;

    // Dispatch WhatsApp
    const evoConfig = getEvolutionConfig();
    let whatsappSent = false;

    if (evoConfig.autoSend) {
      (async () => {
        try {
          for (const tkt of insertedTickets || createdTickets) {
            const tier = tierDataMap[tkt.tier_id];
            let pngBase64 = clientTicketImages[tkt.ticket_code];
            if (!pngBase64) {
              pngBase64 = await generateTicketPngBase64({
                ticketCode: tkt.ticket_code,
                eventTitle: event.title,
                eventDate: event.event_date,
                eventTime: event.event_time,
                location: event.location,
                tierName: tier.name,
                price: tkt.price,
                attendeeName: tkt.attendee_name,
                orderId,
              });
            }

            await sendTicketViaWhatsApp({
              phone: cleanPhone,
              attendeeName: customerName.trim(),
              eventTitle: event.title,
              eventDate: event.event_date,
              eventTime: event.event_time,
              location: event.location,
              ticketCode: tkt.ticket_code,
              tierName: tier.name,
              price: tkt.price,
              imageBase64OrUrl: pngBase64,
            });
          }

          await supabase
            .from('orders')
            .update({ whatsapp_status: 'sent', whatsapp_error: null })
            .eq('id', orderId);
        } catch (err: any) {
          console.error('POS WhatsApp error:', err);
          await supabase
            .from('orders')
            .update({ whatsapp_status: 'failed', whatsapp_error: err?.message || 'Error al enviar WhatsApp' })
            .eq('id', orderId);
        }
      })();
      whatsappSent = true;
    }

    return NextResponse.json({
      success: true,
      orderId,
      totalAmount,
      totalTickets,
      tickets: insertedTickets || createdTickets,
      whatsappSent,
    });
  } catch (error: any) {
    console.error('POS Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar venta' }, { status: 500 });
  }
}
