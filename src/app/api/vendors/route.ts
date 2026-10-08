import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const db = getDb();

    // If admin, show all vendors; if vendor, show only self
    let vendorsQuery = "SELECT id, name, email, role, phone, commission_type, commission_rate, is_active, created_at FROM users WHERE role = 'vendor'";
    if (user.role !== 'admin') {
      vendorsQuery += ` AND id = '${user.id}'`;
    }
    vendorsQuery += ' ORDER BY name ASC';

    const vendorsStmt = db.prepare(vendorsQuery);
    const vendors = vendorsStmt.all() as any[];

    // Calculate aggregated sales & commission for each vendor
    const statsStmt = db.prepare(`
      SELECT 
        COUNT(t.id) as total_tickets_sold,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(SUM(o.vendor_commission_amount), 0) as total_commissions
      FROM orders o
      LEFT JOIN tickets t ON t.order_id = o.id
      WHERE o.vendor_id = ?
    `);

    const payoutStmt = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM commission_payouts
      WHERE vendor_id = ?
    `);

    const enrichedVendors = vendors.map((v) => {
      const stats = statsStmt.get(v.id) as any;
      const payout = payoutStmt.get(v.id) as any;
      const totalCommissions = stats?.total_commissions || 0;
      const totalPaid = payout?.total_paid || 0;

      return {
        ...v,
        total_tickets_sold: stats?.total_tickets_sold || 0,
        total_revenue: stats?.total_revenue || 0,
        total_commissions: totalCommissions,
        total_paid: totalPaid,
        pending_payout: Math.max(0, totalCommissions - totalPaid),
      };
    });

    return NextResponse.json({ vendors: enrichedVendors });
  } catch (error: any) {
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
    const {
      name,
      email,
      password,
      phone,
      commission_type = 'percentage',
      commission_rate = 10,
    } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nombre, correo y contraseña son obligatorios' }, { status: 400 });
    }

    const db = getDb();
    const checkEmail = db.prepare('SELECT id FROM users WHERE email = ?');
    if (checkEmail.get(email.toLowerCase().trim())) {
      return NextResponse.json({ error: 'Ya existe un usuario con este correo electrónico' }, { status: 400 });
    }

    const userId = `usr_vendor_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, phone,
        commission_type, commission_rate, is_active, created_at
      )
      VALUES (?, ?, ?, ?, 'vendor', ?, ?, ?, 1, ?)
    `);

    insert.run(
      userId,
      name.trim(),
      email.toLowerCase().trim(),
      passwordHash,
      phone?.trim() || null,
      commission_type === 'fixed' ? 'fixed' : 'percentage',
      Number(commission_rate) || 0,
      now
    );

    return NextResponse.json({
      success: true,
      vendorId: userId,
      message: 'Vendedor creado exitosamente',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al registrar vendedor' }, { status: 500 });
  }
}
