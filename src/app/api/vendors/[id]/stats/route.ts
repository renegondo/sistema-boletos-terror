import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // A vendor can only see their own stats unless they are admin
    if (user.role !== 'admin' && user.id !== id) {
      return NextResponse.json({ error: 'Acceso denegado a las estadísticas de este vendedor' }, { status: 403 });
    }

    const db = getDb();

    // Get vendor info
    const vendorStmt = db.prepare('SELECT id, name, email, phone, commission_type, commission_rate FROM users WHERE id = ?');
    const vendor = vendorStmt.get(id) as any;

    if (!vendor) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 });
    }

    // Summary calculations
    const summaryStmt = db.prepare(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(t.id) as total_tickets_sold,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(o.vendor_commission_amount), 0) as total_commissions
      FROM orders o
      LEFT JOIN tickets t ON t.order_id = o.id
      WHERE o.vendor_id = ?
    `);
    const summary = summaryStmt.get(id) as any;

    // Payouts paid so far
    const payoutStmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM commission_payouts
      WHERE vendor_id = ?
    `);
    const payoutResult = payoutStmt.get(id) as any;
    const totalPaid = payoutResult?.total_paid || 0;
    const totalCommissions = summary?.total_commissions || 0;
    const pendingBalance = Math.max(0, totalCommissions - totalPaid);

    // Recent orders with events and ticket details
    const ordersStmt = db.prepare(`
      SELECT 
        o.*,
        e.title as event_title,
        e.event_date,
        (SELECT COUNT(*) FROM tickets tk WHERE tk.order_id = o.id) as ticket_count
      FROM orders o
      JOIN events e ON o.event_id = e.id
      WHERE o.vendor_id = ?
      ORDER BY o.created_at DESC
      LIMIT 100
    `);
    const orders = ordersStmt.all(id) as any[];

    // Payout history
    const payoutHistoryStmt = db.prepare(`
      SELECT * FROM commission_payouts WHERE vendor_id = ? ORDER BY paid_at DESC
    `);
    const payouts = payoutHistoryStmt.all(id) as any[];

    return NextResponse.json({
      vendor,
      metrics: {
        total_orders: summary?.total_orders || 0,
        total_tickets_sold: summary?.total_tickets_sold || 0,
        total_revenue: summary?.total_revenue || 0,
        total_commissions: totalCommissions,
        total_paid: totalPaid,
        pending_balance: pendingBalance,
      },
      orders,
      payouts,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener estadísticas del vendedor' }, { status: 500 });
  }
}
