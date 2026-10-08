import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden editar vendedores' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, phone, commission_type, commission_rate, is_active, password } = body;

    const db = getDb();

    if (password && password.trim()) {
      const passwordHash = bcrypt.hashSync(password.trim(), 10);
      const updatePass = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');
      updatePass.run(passwordHash, id);
    }

    const updateStmt = db.prepare(`
      UPDATE users 
      SET 
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        commission_type = COALESCE(?, commission_type),
        commission_rate = COALESCE(?, commission_rate),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `);

    updateStmt.run(
      name?.trim() || null,
      phone?.trim() || null,
      commission_type || null,
      commission_rate !== undefined ? Number(commission_rate) : null,
      is_active !== undefined ? Number(is_active) : null,
      id
    );

    return NextResponse.json({ success: true, message: 'Vendedor actualizado con éxito' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar vendedor' }, { status: 500 });
  }
}
