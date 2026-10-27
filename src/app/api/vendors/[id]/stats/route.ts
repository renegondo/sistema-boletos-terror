import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
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

    if (user.role !== 'admin' && user.id !== id) {
      return NextResponse.json({ error: 'Acceso denegado a las estadísticas de este vendedor' }, { status: 403 });
    }

    const { data: vendor, error: vendorError } = await supabase
      .from('users')
      .select('id, name, email, phone, commission_type, commission_rate')
      .eq('id', id)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendedor no encontrado' }, { status: 404 });
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('id, total_amount, vendor_commission_amount, status, created_at, customer_name, customer_phone, events(title)')
      .eq('vendor_id', id);

    const { data: payouts } = await supabase
      .from('commission_payouts')
      .select('amount')
      .eq('vendor_id', id);

    const { data: tickets } = await supabase.from('tickets').select('id, order_id');
    const orderIds = new Set((orders || []).map((o) => o.id));
    const vendorTickets = (tickets || []).filter((t) => orderIds.has(t.order_id));

    const totalRevenue = (orders || []).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const totalCommissions = (orders || []).reduce((sum, o) => sum + (Number(o.vendor_commission_amount) || 0), 0);
    const totalPaid = (payouts || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pendingBalance = Math.max(0, totalCommissions - totalPaid);

    const recentOrders = (orders || []).slice(0, 10).map((o: any) => ({
      ...o,
      event_title: o.events?.title || 'Horror Fest',
      ticket_count: (tickets || []).filter((t) => t.order_id === o.id).length,
    }));

    return NextResponse.json({
      vendor,
      stats: {
        total_orders: orders?.length || 0,
        total_tickets_sold: vendorTickets.length,
        total_revenue: totalRevenue,
        total_commissions: totalCommissions,
        total_paid: totalPaid,
        pending_balance: pendingBalance,
      },
      recent_orders: recentOrders,
    });
  } catch (error: any) {
    console.error('Error fetching vendor stats:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener estadísticas' }, { status: 500 });
  }
}
