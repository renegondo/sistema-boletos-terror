import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
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

    const updates: Record<string, any> = {};
    if (name?.trim()) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (commission_type) updates.commission_type = commission_type;
    if (commission_rate !== undefined) updates.commission_rate = Number(commission_rate);
    if (is_active !== undefined) updates.is_active = Number(is_active);
    if (password && password.trim()) {
      updates.password_hash = bcrypt.hashSync(password.trim(), 10);
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('users').update(updates).eq('id', id);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'Vendedor actualizado con éxito' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar vendedor' }, { status: 500 });
  }
}
