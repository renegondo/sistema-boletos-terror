import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { sendTicketViaWhatsApp, getEvolutionConfig } from '@/lib/evolution';
import { generateTicketPngBase64 } from '@/lib/ticket-generator';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    const orderId = searchParams.get('orderId');
    const eventId = searchParams.get('eventId');

    let query = supabase
      .from('orders')
      .select('*, events(title, event_date, event_time, location), tickets(id, ticket_code, tier_id, price, status, attendee_name)');

    if (status) query = query.eq('status', status);
    if (eventId) query = query.eq('event_id', eventId);
    if (orderId) query = query.eq('id', orderId);
    if (phone) {
      const clean = phone.replace(/[^\d]/g, '');
      query = query.ilike('customer_phone', `%${clean}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data: rawOrders, error } = await query;
    if (error) throw error;

    const { data: allTiers } = await supabase.from('ticket_tiers').select('id, name');
    const tierMap = new Map((allTiers || []).map((t) => [t.id, t.name]));

    const orders = (rawOrders || []).map((ord) => {
      const event = ord.events;
      const orderTickets = (ord.tickets || []).map((t: any) => ({
        ...t,
        tier_name: tierMap.get(t.tier_id) || 'Boleto',
      }));

      return {
        ...ord,
        event_title: event?.title || 'Horror Fest',
        event_date: event?.event_date || '2026-11-01',
        event_time: event?.event_time || '21:00',
        location: event?.location || 'Salón del Sindicato del IMSS',
        ticket_count: orderTickets.length,
        tickets: orderTickets,
      };
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener órdenes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eventId = 'evt_rodada_terror_2026',
      customerName,
      customerPhone,
      customerEmail,
      quantity = 1,
      tierId = 'tier_terror_001',
      rpCode,
      notes,
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Nombre y WhatsApp son obligatorios' },
        { status: 400 }
      );
    }

    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const { data: tier } = await supabase
      .from('ticket_tiers')
      .select('*')
      .eq('id', tierId)
      .single();

    const priceUnit = tier ? Number(tier.price) : 150;
    const tierName = tier ? tier.name : 'Cover General BYOB';
    const totalAmount = priceUnit * Number(quantity);

    // RP check
    let vendorId = 'usr_vendor_001';
    let commissionRate = 10.0;
    let commissionType = 'percentage';

    if (rpCode) {
      const { data: vendor } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${rpCode},name.ilike.%${rpCode}%,phone.ilike.%${rpCode}%`)
        .eq('is_active', 1)
        .limit(1)
        .maybeSingle();

      if (vendor) {
        vendorId = vendor.id;
        commissionRate = Number(vendor.commission_rate) || 10.0;
        commissionType = vendor.commission_type || 'percentage';
      }
    }

    let commissionAmount = 0;
    if (commissionType === 'percentage') {
      commissionAmount = (totalAmount * commissionRate) / 100;
    } else {
      commissionAmount = commissionRate * Number(quantity);
    }

    const orderId = `ord_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const cleanPhone = customerPhone.replace(/[^\d]/g, '');

    const orderNotes = JSON.stringify({
      rp_code: rpCode || null,
      custom_notes: notes || null,
      tier_id: tierId,
      tier_name: tierName,
      quantity: Number(quantity),
      price_unit: priceUnit,
    });

    const { error: insertOrderError } = await supabase.from('orders').insert({
      id: orderId,
      event_id: eventId,
      vendor_id: vendorId,
      customer_name: customerName.trim(),
      customer_phone: cleanPhone,
      customer_email: customerEmail?.trim() || null,
      payment_method: 'cash',
      total_amount: totalAmount,
      vendor_commission_amount: commissionAmount,
      commission_type_applied: commissionType,
      commission_rate_applied: commissionRate,
      status: 'pending',
      whatsapp_status: 'pending',
      notes: orderNotes,
    });

    if (insertOrderError) throw insertOrderError;

    // Pre-create tickets
    const tickets = [];
    for (let i = 0; i < Number(quantity); i++) {
      const ticketId = `tkt_${Date.now()}_${i}_${crypto.randomBytes(3).toString('hex')}`;
      const codeSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const ticketCode = `HF26-${codeSuffix}`;
      const qrData = JSON.stringify({
        code: ticketCode,
        event: event.title,
        attendee: customerName.trim(),
        order: orderId,
      });

      tickets.push({
        id: ticketId,
        ticket_code: ticketCode,
        order_id: orderId,
        tier_id: tierId,
        event_id: eventId,
        attendee_name: customerName.trim(),
        price: priceUnit,
        qr_data: qrData,
        status: 'valid',
      });
    }

    if (tickets.length > 0) {
      const { error: insertTicketsError } = await supabase.from('tickets').insert(tickets);
      if (insertTicketsError) {
        console.error('Error inserting tickets:', insertTicketsError);
        throw insertTicketsError;
      }
    }

    const formattedTickets = tickets.map((t) => ({
      id: t.id,
      code: t.ticket_code,
      image: `/api/tickets/${t.ticket_code}/image?format=png`,
      price: t.price,
      attendee: t.attendee_name,
    }));

    // Dispatch WhatsApp tickets asynchronously
    const evoConfig = getEvolutionConfig();
    let whatsappDispatched = false;

    if (evoConfig.autoSend) {
      (async () => {
        try {
          for (const tkt of tickets) {
            const pngBase64 = await generateTicketPngBase64({
              ticketCode: tkt.ticket_code,
              eventTitle: event.title,
              eventDate: event.event_date,
              eventTime: event.event_time,
              location: event.location,
              tierName: tierName,
              price: tkt.price,
              attendeeName: tkt.attendee_name,
              orderId: orderId,
            });

            await sendTicketViaWhatsApp({
              phone: cleanPhone,
              attendeeName: tkt.attendee_name,
              eventTitle: event.title,
              eventDate: event.event_date,
              eventTime: event.event_time,
              location: event.location,
              ticketCode: tkt.ticket_code,
              tierName: tierName,
              price: tkt.price,
              imageBase64OrUrl: pngBase64,
              isPending: true,
            });
          }

          await supabase
            .from('orders')
            .update({ whatsapp_status: 'sent', whatsapp_error: null })
            .eq('id', orderId);
        } catch (err: any) {
          console.error('Error dispatching WhatsApp tickets on order creation:', err);
          await supabase
            .from('orders')
            .update({ whatsapp_status: 'failed', whatsapp_error: err?.message || 'Error al enviar WhatsApp' })
            .eq('id', orderId);
        }
      })();
      whatsappDispatched = true;
    }

    return NextResponse.json({
      success: true,
      orderId,
      totalAmount,
      currency: 'MXN',
      tickets: formattedTickets,
      whatsappDispatched,
      paymentInstructions: {
        method: 'cash',
        note: 'Pago únicamente en efectivo en taquilla / con tu RP al ingresar',
        concept: orderId,
      },
    });
  } catch (error: any) {
    console.error('Error in orders POST:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar la orden' }, { status: 500 });
  }
}
