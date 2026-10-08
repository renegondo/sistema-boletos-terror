import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const orderStmt = db.prepare(`
      SELECT 
        o.*,
        e.title as event_title,
        e.event_date,
        e.event_time,
        e.location,
        e.banner_url
      FROM orders o
      JOIN events e ON o.event_id = e.id
      WHERE o.id = ?
    `);

    const order = orderStmt.get(id) as any;
    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const ticketsStmt = db.prepare(`
      SELECT t.*, tt.name as tier_name
      FROM tickets t
      LEFT JOIN ticket_tiers tt ON t.tier_id = tt.id
      WHERE t.order_id = ?
    `);
    const tickets = ticketsStmt.all(id);

    return NextResponse.json({ order, tickets });
  } catch (error: any) {
    console.error('Error fetching order by ID:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener orden' }, { status: 500 });
  }
}
