import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let query = supabase.from('users').select('*').eq('role', 'vendor');
    if (user.role !== 'admin') {
      query = query.eq('id', user.id);
    }
    query = query.order('name', { ascending: true });

    const { data: vendors, error: vendorsError } = await query;
    if (vendorsError) throw vendorsError;

    const { data: allOrders } = await supabase.from('orders').select('id, vendor_id, total_amount, vendor_commission_amount');
    const { data: allTickets } = await supabase.from('tickets').select('id, order_id');
    const { data: allPayouts } = await supabase.from('commission_payouts').select('vendor_id, amount');

    const enrichedVendors = (vendors || []).map((v) => {
      const vendorOrders = (allOrders || []).filter((o) => o.vendor_id === v.id);
      const orderIds = new Set(vendorOrders.map((o) => o.id));
      const vendorTickets = (allTickets || []).filter((t) => orderIds.has(t.order_id));
      const vendorPayouts = (allPayouts || []).filter((p) => p.vendor_id === v.id);

      const totalRevenue = vendorOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const totalCommissions = vendorOrders.reduce((sum, o) => sum + (Number(o.vendor_commission_amount) || 0), 0);
      const totalPaid = vendorPayouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      return {
        ...v,
        total_tickets_sold: vendorTickets.length,
        total_revenue: totalRevenue,
        total_commissions: totalCommissions,
        total_paid: totalPaid,
        pending_payout: Math.max(0, totalCommissions - totalPaid),
      };
    });

    return NextResponse.json({ vendors: enrichedVendors });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener vendedores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden crear vendedores' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, phone, commission_type = 'percentage', commission_rate = 10.0 } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nombre, correo y contraseña son obligatorios' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const { data: existing } = await supabase.from('users').select('id').eq('email', cleanEmail).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un usuario registrado con este correo' }, { status: 400 });
    }

    const vendorId = `usr_vendor_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const passwordHash = bcrypt.hashSync(password.trim(), 10);

    const { error: insertError } = await supabase.from('users').insert({
      id: vendorId,
      name: name.trim(),
      email: cleanEmail,
      password_hash: passwordHash,
      role: 'vendor',
      phone: phone?.trim() || null,
      commission_type,
      commission_rate: Number(commission_rate) || 0,
      is_active: 1,
    });

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: 'Vendedor creado exitosamente',
      vendor: {
        id: vendorId,
        name: name.trim(),
        email: cleanEmail,
        role: 'vendor',
        phone: phone?.trim() || null,
        commission_type,
        commission_rate: Number(commission_rate) || 0,
      },
    });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: error.message || 'Error al crear vendedor' }, { status: 500 });
  }
}
