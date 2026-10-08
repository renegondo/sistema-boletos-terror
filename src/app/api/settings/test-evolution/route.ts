import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { testEvolutionConnection } from '@/lib/evolution';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const result = await testEvolutionConnection();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Error en prueba de conexión' }, { status: 500 });
  }
}
