import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendTicketViaWhatsApp } from '@/lib/evolution';
import { generateTicketPngBase64 } from '@/lib/ticket-generator';
import crypto from 'node:crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const phone = searchParams.get('phone');
    const orderId = searchParams.get('orderId');
    const eventId = searchParams.get('eventId');

    const db = getDb();
    let query = `
      SELECT 
        o.*,
        e.title as event_title,
        e.event_date,
        e.event_time,
        e.location,
        (SELECT COUNT(*) FROM tickets t WHERE t.order_id = o.id) as ticket_count
      FROM orders o
      JOIN events e ON o.event_id = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    if (eventId) {
      query += ' AND o.event_id = ?';
      params.push(eventId);
    }
    if (orderId) {
      query += ' AND o.id = ?';
      params.push(orderId);
    }
    if (phone) {
      const clean = phone.replace(/[^\d]/g, '');
      query += ' AND (o.customer_phone LIKE ? OR o.customer_phone = ?)';
      params.push(`%${clean}%`, clean);
    }

    query += ' ORDER BY o.created_at DESC';

    const ordersStmt = db.prepare(query);
    const orders = ordersStmt.all(...params) as any[];

    // Fetch tickets for completed orders
    const ticketsStmt = db.prepare(`
      SELECT t.*, tt.name as tier_name
      FROM tickets t
      LEFT JOIN ticket_tiers tt ON t.tier_id = tt.id
      WHERE t.order_id = ?
    `);

    const enrichedOrders = orders.map((ord) => {
      const tickets = ticketsStmt.all(ord.id);
      return {
        ...ord,
        tickets,
      };
    });

    return NextResponse.json({ orders: enrichedOrders });
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
      tierId = 'tier_terror_001',
      quantity = 1,
      notes = '',
      rpCode = '',
    } = body;

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'El nombre completo y teléfono de WhatsApp son requeridos.' },
        { status: 400 }
      );
    }

    const cleanPhone = customerPhone.replace(/[^\d]/g, '');
    if (cleanPhone.length < 8) {
      return NextResponse.json(
        { error: 'Por favor ingresa un número telefónico de WhatsApp válido.' },
        { status: 400 }
      );
    }

    const parsedQty = Math.max(1, Math.min(10, Number(quantity) || 1));

    const db = getDb();

    // Verify Event
    const eventStmt = db.prepare('SELECT * FROM events WHERE id = ?');
    const event = eventStmt.get(eventId) as any;
    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    // Verify Tier
    const tierStmt = db.prepare('SELECT * FROM ticket_tiers WHERE id = ? AND event_id = ?');
    const tier = tierStmt.get(tierId, eventId) as any;
    if (!tier) {
      return NextResponse.json({ error: 'Tipo de boleto no válido' }, { status: 400 });
    }

    if (tier.id === 'tier_terror_001' && tier.price !== 150) {
      tier.price = 150;
      tier.name = 'Cover General BYOB (Preventa Etapa 1)';
      try {
        db.prepare("UPDATE ticket_tiers SET price = 150.0, name = 'Cover General BYOB (Preventa Etapa 1)' WHERE id = 'tier_terror_001'").run();
      } catch {}
    }

    // Check capacity
    if (tier.sold_count + parsedQty > tier.capacity) {
      return NextResponse.json(
        { error: `Cupo insuficiente para "${tier.name}". Lugares restantes: ${tier.capacity - tier.sold_count}` },
        { status: 400 }
      );
    }

    const totalAmount = tier.price * parsedQty;
    const orderId = `ORD-PR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();

    // Default vendor assigned to online landing pre-registrations: usr_admin_001
    let vendorId = 'usr_admin_001';

    if (rpCode) {
      // Find RP by ID, code, or name
      const rpStmt = db.prepare('SELECT id FROM users WHERE role = ? AND (id = ? OR email LIKE ? OR name LIKE ? COLLATE NOCASE)');
      const rpMatch = rpStmt.get('vendor', rpCode.trim(), `%${rpCode.trim()}%`, `%${rpCode.trim()}%`) as any;
      if (rpMatch) {
        vendorId = rpMatch.id;
      }
    }

    // Insert Order with status 'pending'
    const insertOrder = db.prepare(`
      INSERT INTO orders (
        id, event_id, vendor_id, customer_name, customer_phone, customer_email,
        payment_method, total_amount, vendor_commission_amount,
        commission_type_applied, commission_rate_applied, status,
        whatsapp_status, notes, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 'pre_registered', ?, 0, 'percentage', 0, 'pending', 'pending', ?, ?)
    `);

    insertOrder.run(
      orderId,
      eventId,
      vendorId,
      customerName.trim(),
      cleanPhone,
      customerEmail?.trim() || null,
      totalAmount,
      JSON.stringify({
        tier_id: tier.id,
        tier_name: tier.name,
        quantity: parsedQty,
        price_unit: tier.price,
        biker_notes: notes?.trim() || '',
      }),
      now
    );

    // Create individual tickets
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
    updateTierSold.run(parsedQty, tier.id);

    let anyWaSuccess = false;
    let lastWaError = '';
    const generatedTickets = [];
    
    // Generate and send tickets
    for (let i = 0; i < parsedQty; i++) {
      const ticketId = `tkt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const ticketCode = `TKT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const attendeeName = `${customerName.trim()}${parsedQty > 1 ? ` (#${i + 1})` : ''}`;

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

      try {
        const ticketImage = await generateTicketPngBase64({
          ticketCode,
          eventTitle: event.title,
          eventDate: event.event_date,
          eventTime: event.event_time,
          location: event.location,
          tierName: tier.name,
          price: tier.price,
          attendeeName,
          orderId,
        });

        const waResult = await sendTicketViaWhatsApp({
          phone: cleanPhone,
          ticketCode,
          attendeeName,
          eventTitle: event.title,
          eventDate: event.event_date,
          eventTime: event.event_time,
          location: event.location,
          tierName: tier.name,
          price: tier.price,
          imageBase64OrUrl: ticketImage,
          isPending: true,
        });

        if (waResult.success) anyWaSuccess = true;
        if (waResult.error) lastWaError = waResult.error;

        generatedTickets.push({
          code: ticketCode,
          image: ticketImage,
        });
      } catch (err: any) {
        console.error('WhatsApp generation/send error:', err);
        lastWaError = err.message;
      }
    }

    if (anyWaSuccess) {
      db.prepare("UPDATE orders SET whatsapp_status = 'sent' WHERE id = ?").run(orderId);
    } else {
      db.prepare('UPDATE orders SET whatsapp_status = ?, whatsapp_error = ? WHERE id = ?').run(
        'failed',
        lastWaError || 'Error enviando tickets',
        orderId
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pre-registro completado y tickets enviados (Pendientes de pago)',
      order: {
        id: orderId,
        event_title: event.title,
        customer_name: customerName.trim(),
        customer_phone: cleanPhone,
        customer_email: customerEmail || null,
        tier_name: tier.name,
        quantity: parsedQty,
        total_amount: totalAmount,
        status: 'pending',
        whatsapp_status: anyWaSuccess ? 'sent' : 'failed',
        created_at: now,
      },
      tickets: generatedTickets,
    });
  } catch (error: any) {
    console.error('Pre-registration error:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar el pre-registro' }, { status: 500 });
  }
}
