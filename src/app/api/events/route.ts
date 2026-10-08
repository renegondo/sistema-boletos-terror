import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'node:crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const db = getDb();
    let query = 'SELECT * FROM events';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY event_date ASC, created_at DESC';

    const eventsStmt = db.prepare(query);
    const events = (params.length ? eventsStmt.all(...params) : eventsStmt.all()) as any[];

    // Fetch tiers and sales stats for each event
    const tierStmt = db.prepare('SELECT * FROM ticket_tiers WHERE event_id = ? ORDER BY price ASC');
    const statsStmt = db.prepare('SELECT COUNT(*) as total_tickets, COALESCE(SUM(total_amount), 0) as total_revenue FROM orders WHERE event_id = ?');

    const enrichedEvents = events.map((event) => {
      const tiers = tierStmt.all(event.id) as any[];
      const stats = statsStmt.get(event.id) as any;
      return {
        ...event,
        tiers,
        total_sold: stats?.total_tickets || 0,
        total_revenue: stats?.total_revenue || 0,
      };
    });

    return NextResponse.json({ events: enrichedEvents });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener eventos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden crear eventos' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, location, event_date, event_time, banner_url, tiers } = body;

    if (!title || !location || !event_date || !event_time) {
      return NextResponse.json({ error: 'Título, ubicación, fecha y hora son obligatorios' }, { status: 400 });
    }

    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
      return NextResponse.json({ error: 'Debes definir al menos un tipo de boleto' }, { status: 400 });
    }

    const db = getDb();
    const eventId = `evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    const insertEvent = db.prepare(`
      INSERT INTO events (id, title, description, location, event_date, event_time, banner_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
    `);

    insertEvent.run(
      eventId,
      title.trim(),
      description?.trim() || '',
      location.trim(),
      event_date,
      event_time,
      banner_url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
      now
    );

    const insertTier = db.prepare(`
      INSERT INTO ticket_tiers (id, event_id, name, price, capacity, sold_count, description)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `);

    for (const tier of tiers) {
      const tierId = `tier_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      insertTier.run(
        tierId,
        eventId,
        tier.name.trim(),
        Number(tier.price) || 0,
        Number(tier.capacity) || 100,
        tier.description || ''
      );
    }

    return NextResponse.json({
      success: true,
      eventId,
      message: 'Evento creado exitosamente',
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: error.message || 'Error al crear evento' }, { status: 500 });
  }
}
