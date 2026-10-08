import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'node:crypto';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const eventStmt = db.prepare('SELECT * FROM events WHERE id = ?');
    const event = eventStmt.get(id) as any;

    if (!event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const tierStmt = db.prepare('SELECT * FROM ticket_tiers WHERE event_id = ? ORDER BY price ASC');
    const tiers = tierStmt.all(id) as any[];

    const salesStmt = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(vendor_commission_amount), 0) as total_commissions
      FROM orders 
      WHERE event_id = ?
    `);
    const stats = salesStmt.get(id) as any;

    return NextResponse.json({
      event: {
        ...event,
        tiers,
        stats,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener el evento' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden editar eventos' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, location, event_date, event_time, banner_url, status = 'active', tiers } = body;

    if (!title || !location || !event_date || !event_time) {
      return NextResponse.json({ error: 'Título, ubicación, fecha y hora son obligatorios' }, { status: 400 });
    }

    const db = getDb();

    // Update event record
    const updateEvent = db.prepare(`
      UPDATE events 
      SET 
        title = ?,
        description = ?,
        location = ?,
        event_date = ?,
        event_time = ?,
        banner_url = ?,
        status = ?
      WHERE id = ?
    `);

    updateEvent.run(
      title.trim(),
      description?.trim() || '',
      location.trim(),
      event_date,
      event_time,
      banner_url || null,
      status,
      id
    );

    // Update / insert tiers if provided
    if (tiers && Array.isArray(tiers) && tiers.length > 0) {
      const existingTiersStmt = db.prepare('SELECT id, sold_count FROM ticket_tiers WHERE event_id = ?');
      const existingTiers = existingTiersStmt.all(id) as Array<{ id: string; sold_count: number }>;
      const existingIds = new Set(existingTiers.map(t => t.id));

      const insertTier = db.prepare(`
        INSERT INTO ticket_tiers (id, event_id, name, price, capacity, sold_count, description)
        VALUES (?, ?, ?, ?, ?, 0, ?)
      `);

      const updateTier = db.prepare(`
        UPDATE ticket_tiers
        SET name = ?, price = ?, capacity = ?, description = ?
        WHERE id = ? AND event_id = ?
      `);

      const keptIds = new Set<string>();

      for (const tier of tiers) {
        if (tier.id && existingIds.has(tier.id)) {
          updateTier.run(
            tier.name.trim(),
            Number(tier.price) || 0,
            Number(tier.capacity) || 100,
            tier.description || '',
            tier.id,
            id
          );
          keptIds.add(tier.id);
        } else {
          const newTierId = `tier_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
          insertTier.run(
            newTierId,
            id,
            tier.name.trim(),
            Number(tier.price) || 0,
            Number(tier.capacity) || 100,
            tier.description || ''
          );
          keptIds.add(newTierId);
        }
      }

      // Delete removed tiers that have 0 sales
      const deleteTier = db.prepare('DELETE FROM ticket_tiers WHERE id = ? AND event_id = ? AND sold_count = 0');
      for (const t of existingTiers) {
        if (!keptIds.has(t.id) && t.sold_count === 0) {
          deleteTier.run(t.id, id);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Evento actualizado correctamente' });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: error.message || 'Error al actualizar evento' }, { status: 500 });
  }
}


export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const db = getDb();

    // Cascade delete associated records
    db.prepare('DELETE FROM tickets WHERE event_id = ?').run(id);
    db.prepare('DELETE FROM orders WHERE event_id = ?').run(id);
    db.prepare('DELETE FROM ticket_tiers WHERE event_id = ?').run(id);
    db.prepare('DELETE FROM events WHERE id = ?').run(id);

    return NextResponse.json({ success: true, message: 'Evento eliminado exitosamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar evento' }, { status: 500 });
  }
}
