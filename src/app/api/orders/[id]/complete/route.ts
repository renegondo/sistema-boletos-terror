import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateTicketPngBase64 } from '@/lib/ticket-generator';
import { sendTicketViaWhatsApp, getEvolutionConfig } from '@/lib/evolution';
import crypto from 'node:crypto';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Fetch order
    const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ?');
    const order = orderStmt.get(id) as any;
    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    if (order.status === 'completed') {
      // Order is already completed, check if tickets exist
      const existingTickets = db.prepare('SELECT * FROM tickets WHERE order_id = ?').all(id);
      return NextResponse.json({
        success: true,
        message: 'La orden ya estaba marcada como completada',
        order,
        tickets: existingTickets,
      });
    }

    // Fetch event
    const eventStmt = db.prepare('SELECT * FROM events WHERE id = ?');
    const event = eventStmt.get(order.event_id) as any;
    if (!event) {
      return NextResponse.json({ error: 'Evento asociado no encontrado' }, { status: 404 });
    }

    // Parse notes to retrieve tier info if pre-registered
    let tierId = 'tier_terror_001';
    let quantity = 1;
    let tierName = 'Cover General BYOB';
    let unitPrice = 200;

    if (order.notes) {
      try {
        const parsed = JSON.parse(order.notes);
        if (parsed.tier_id) tierId = parsed.tier_id;
        if (parsed.quantity) quantity = Number(parsed.quantity) || 1;
        if (parsed.tier_name) tierName = parsed.tier_name;
        if (parsed.price_unit) unitPrice = Number(parsed.price_unit) || 200;
      } catch {
        // Not JSON notes
      }
    }

    // Fetch ticket tier from DB
    const tierStmt = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?');
    const dbTier = tierStmt.get(tierId) as any;
    if (dbTier) {
      tierName = dbTier.name;
      unitPrice = dbTier.price;
    }

    const now = new Date().toISOString();
    
    // Check if tickets already exist for this order (from pre-registration)
    const existingTickets = db.prepare('SELECT * FROM tickets WHERE order_id = ?').all(order.id);
    let createdTickets: any[] = existingTickets;

    if (existingTickets.length === 0) {
      // Create tickets if they don't exist yet
      if (dbTier) {
        db.prepare('UPDATE ticket_tiers SET sold_count = sold_count + ? WHERE id = ?').run(quantity, dbTier.id);
      }

      const insertTicket = db.prepare(`
        INSERT INTO tickets (
          id, ticket_code, order_id, tier_id, event_id, attendee_name,
          price, qr_data, status, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'valid', ?)
      `);

      for (let i = 0; i < quantity; i++) {
        const ticketId = `tkt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        const ticketCode = `TKT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const attendeeName = `${order.customer_name}${quantity > 1 ? ` (#${i + 1})` : ''}`;

        const qrData = JSON.stringify({
          c: ticketCode,
          e: event.id,
          o: order.id,
        });

        insertTicket.run(
          ticketId,
          ticketCode,
          order.id,
          tierId,
          event.id,
          attendeeName,
          unitPrice,
          qrData,
          now
        );

        createdTickets.push({
          id: ticketId,
          ticket_code: ticketCode,
          attendee_name: attendeeName,
          price: unitPrice,
          tier_name: tierName,
        });
      }
    }

    // Mark order as completed
    db.prepare("UPDATE orders SET status = 'completed' WHERE id = ?").run(order.id);

    // Send WhatsApp confirmation
    const evolutionConfig = getEvolutionConfig();
    let whatsappResults: { success: boolean; error?: string }[] = [];
    let overallWhatsappStatus: 'sent' | 'failed' | 'pending' = 'pending';
    let whatsappErrorMessage = '';

    if (evolutionConfig.apiKey && evolutionConfig.instanceName) {
      try {
        const endpoint = `${evolutionConfig.apiUrl}/message/sendText/${encodeURIComponent(evolutionConfig.instanceName)}`;
        const messageText = `✅ *¡PAGO RECIBIDO EXITOSAMENTE!* ✅\n\nHola *${order.customer_name}*, hemos validado tu pago para *${event.title}*.\n\nTus boletos QR ahora están *ACTIVOS* y listos para ser escaneados en puerta.\n\n¡Nos vemos en el evento!`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'apikey': evolutionConfig.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: order.customer_phone,
            text: messageText,
          }),
        });

        if (res.ok) {
          whatsappResults.push({ success: true });
        } else {
          whatsappResults.push({ success: false, error: 'Failed to send confirmation text' });
        }
      } catch (err: any) {
        whatsappResults.push({ success: false, error: err.message });
      }
    }

    const anySuccess = whatsappResults.some((r) => r.success);
    if (anySuccess) {
      overallWhatsappStatus = 'sent';
      db.prepare("UPDATE orders SET whatsapp_status = 'sent', whatsapp_error = NULL WHERE id = ?").run(order.id);
    } else if (whatsappResults.length > 0) {
      overallWhatsappStatus = 'failed';
    }

    return NextResponse.json({
      success: true,
      message: 'Orden marcada como completada y boletos generados exitosamente',
      order: {
        ...order,
        status: 'completed',
        whatsapp_status: overallWhatsappStatus,
      },
      tickets: createdTickets,
      whatsappResults,
    });
  } catch (error: any) {
    console.error('Error completing order:', error);
    return NextResponse.json({ error: error.message || 'Error al completar la orden' }, { status: 500 });
  }
}
