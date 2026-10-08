import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const db = getDb();

    const stmt = db.prepare(`
      SELECT 
        t.*,
        e.title as event_title,
        e.event_date,
        e.event_time,
        e.location as event_location,
        tt.name as tier_name,
        o.customer_name,
        o.customer_phone,
        u.name as vendor_name
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_tiers tt ON t.tier_id = tt.id
      JOIN orders o ON t.order_id = o.id
      JOIN users u ON o.vendor_id = u.id
      WHERE t.ticket_code = ? OR t.id = ?
    `);

    const ticket = stmt.get(code.toUpperCase().trim(), code) as any;

    if (!ticket) {
      return NextResponse.json({ error: 'Boleto no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al consultar boleto' }, { status: 500 });
  }
}
