import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
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
      clientTicketImages = {}, // optional base64 tickets from canvas
    } = body;

    if (!eventId || !customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (evento, nombre, teléfono y boletos)' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify event
    const eventStmt = db.prepare('SELECT * FROM events WHERE id = ?');
    const event = eventStmt.get(eventId) as any;
    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Get vendor details (re-fetch to get freshest commission rates)
    const vendorStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const vendor = (vendorStmt.get(user.id) as any) || user;

    const commissionType = vendor.commission_type || 'percentage';
    const commissionRate = Number(vendor.commission_rate) || 0;

    // Calculate totals & validate capacity
    let totalTickets = 0;
    let totalAmount = 0;
    const tierDataMap: Record<string, any> = {};

    for (const item of items) {
      const tierStmt = db.prepare('SELECT * FROM ticket_tiers WHERE id = ? AND event_id = ?');
      const tier = tierStmt.get(item.tierId, eventId) as any;

      if (!tier) {
        return NextResponse.json({ error: `Tipo de boleto no válido: ${item.tierId}` }, { status: 400 });
      }

      if (tier.sold_count + item.quantity > tier.capacity) {
        return NextResponse.json(
          { error: `Cupo insuficiente para "${tier.name}". Disponibles: ${tier.capacity - tier.sold_count}` },
          { status: 400 }
        );
      }

      tierDataMap[item.tierId] = tier;
      totalTickets += item.quantity;
      totalAmount += tier.price * item.quantity;
    }

    // Calculate vendor commission
    let commissionAmount = 0;
    if (commissionType === 'percentage') {
      commissionAmount = (totalAmount * commissionRate) / 100;
    } else {
      // Fixed commission per ticket
      commissionAmount = commissionRate * totalTickets;
    }

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();

    // Insert Order
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        id, event_id, vendor_id, customer_name, customer_phone, customer_email,
        payment_method, total_amount, vendor_commission_amount,
        commission_type_applied, commission_rate_applied, status,
        whatsapp_status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'pending', ?)
    `);

    insertOrder.run(
      orderId,
      eventId,
      vendor.id,
      customerName.trim(),
      customerPhone.trim(),
      customerEmail?.trim() || null,
      paymentMethod,
      totalAmount,
      commissionAmount,
      commissionType,
      commissionRate,
      now
    );

    // Create individual tickets
    const createdTickets: any[] = [];
    const insertTicket = db.prepare(`
      INSERT INTO tickets (
        id, ticket_code, order_id, tier_id, event_id, attendee_name,
        price, qr_data, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'valid', ?)
    `);

    const updateTierSold = db.prepare(`
      UPDATE ticket_tiers SET sold_count = sold_count + ? WHERE id = ?
    `);

    let ticketIndex = 0;
    for (const item of items) {
      const tier = tierDataMap[item.tierId];
      updateTierSold.run(item.quantity, tier.id);

      for (let i = 0; i < item.quantity; i++) {
        const ticketId = `tkt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        const ticketCode = `TKT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const attendeeName =
          (item.attendeeNames && item.attendeeNames[i]?.trim()) ||
          `${customerName}${item.quantity > 1 ? ` (#${i + 1})` : ''}`;

        const qrData = JSON.stringify({
          c: ticketCode,
          e: eventId,
          o: orderId,
        });

        insertTicket.run(
          ticketId,
          ticketCode,
          orderId,
          tier.id,
          eventId,
          attendeeName,
          tier.price,
          qrData,
          now
        );

        createdTickets.push({
          id: ticketId,
          ticket_code: ticketCode,
          attendee_name: attendeeName,
          price: tier.price,
          tier_name: tier.name,
          ticket_index: ticketIndex,
        });

        ticketIndex++;
      }
    }

    // Try Evolution API WhatsApp Dispatch
    const evolutionConfig = getEvolutionConfig();
    let whatsappResults: { success: boolean; error?: string }[] = [];
    let overallWhatsappStatus: 'sent' | 'failed' | 'pending' = 'pending';
    let whatsappErrorMessage = '';

    if (evolutionConfig.autoSend && evolutionConfig.apiKey && evolutionConfig.instanceName) {
      for (const tkt of createdTickets) {
        try {
          // Check if client supplied a high-res canvas PNG data URL for this ticket
          let ticketImage = clientTicketImages[tkt.ticket_code] || clientTicketImages[tkt.id];

          // If no client image, generate high-resolution PNG Base64
          if (!ticketImage) {
            ticketImage = await generateTicketPngBase64({
              ticketCode: tkt.ticket_code,
              eventTitle: event.title,
              eventDate: event.event_date,
              eventTime: event.event_time,
              location: event.location,
              tierName: tkt.tier_name,
              price: tkt.price,
              attendeeName: tkt.attendee_name,
              orderId,
            });
          }

          const sendResult = await sendTicketViaWhatsApp({
            phone: customerPhone,
            ticketCode: tkt.ticket_code,
            attendeeName: tkt.attendee_name,
            eventTitle: event.title,
            eventDate: event.event_date,
            eventTime: event.event_time,
            location: event.location,
            tierName: tkt.tier_name,
            price: tkt.price,
            imageBase64OrUrl: ticketImage,
          });

          whatsappResults.push(sendResult);
          if (!sendResult.success) {
            whatsappErrorMessage = sendResult.error || 'Error al enviar por WhatsApp';
          }
        } catch (err: any) {
          whatsappResults.push({ success: false, error: err.message });
          whatsappErrorMessage = err.message;
        }
      }

      const anySuccess = whatsappResults.some((r) => r.success);
      overallWhatsappStatus = anySuccess ? 'sent' : 'failed';

      // Update order WhatsApp status
      const updateOrderWa = db.prepare(`
        UPDATE orders SET whatsapp_status = ?, whatsapp_error = ? WHERE id = ?
      `);
      updateOrderWa.run(overallWhatsappStatus, whatsappErrorMessage || null, orderId);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        event_title: event.title,
        customer_name: customerName,
        customer_phone: customerPhone,
        total_amount: totalAmount,
        total_tickets: totalTickets,
        vendor_commission_amount: commissionAmount,
        commission_type_applied: commissionType,
        commission_rate_applied: commissionRate,
        payment_method: paymentMethod,
        whatsapp_status: overallWhatsappStatus,
        whatsapp_error: whatsappErrorMessage,
        tickets: createdTickets,
      },
    });
  } catch (error: any) {
    console.error('POS Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar la venta de taquilla' }, { status: 500 });
  }
}
