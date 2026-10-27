import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { data: rows, error } = await supabase.from('settings').select('*');
    if (error) throw error;

    const settings: Record<string, string> = {};
    for (const row of rows || []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener configuración' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden cambiar la configuración' }, { status: 403 });
    }

    const body = await request.json();
    const updates = [];

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        updates.push({ key, value: String(value) });
      }
    }

    if (updates.length > 0) {
      const { error } = await supabase.from('settings').upsert(updates);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'Configuración guardada correctamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al guardar configuración' }, { status: 500 });
  }
}
