import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'node:crypto';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 });
    }

    const { data: tiers } = await supabase
      .from('ticket_tiers')
      .select('*')
      .eq('event_id', id)
      .order('price', { ascending: true });

    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, vendor_commission_amount')
      .eq('event_id', id);

    let totalOrders = orders?.length || 0;
    let totalRevenue = 0;
    let totalCommissions = 0;

    if (orders) {
      for (const ord of orders) {
        totalRevenue += Number(ord.total_amount) || 0;
        totalCommissions += Number(ord.vendor_commission_amount) || 0;
      }
    }

    return NextResponse.json({
      event: {
        ...event,
        tiers: tiers || [],
        stats: {
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          total_commissions: totalCommissions,
        },
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
    const { title, description, location, event_date, event_time, banner_url, status, tiers } = body;

    const updates: Record<string, any> = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (location) updates.location = location;
    if (event_date) updates.event_date = event_date;
    if (event_time) updates.event_time = event_time;
    if (banner_url !== undefined) updates.banner_url = banner_url;
    if (status) updates.status = status;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
    }

    // Update tiers if provided
    if (tiers && Array.isArray(tiers)) {
      for (const tier of tiers) {
        if (tier.id) {
          await supabase
            .from('ticket_tiers')
            .update({
              name: tier.name,
              price: Number(tier.price),
              capacity: Number(tier.capacity),
              description: tier.description,
            })
            .eq('id', tier.id);
        } else {
          const tierId = `tier_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
          await supabase
            .from('ticket_tiers')
            .insert({
              id: tierId,
              event_id: id,
              name: tier.name,
              price: Number(tier.price),
              capacity: Number(tier.capacity),
              sold_count: 0,
              description: tier.description,
            });
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Evento actualizado correctamente' });
  } catch (error: any) {
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
      return NextResponse.json({ error: 'Solo administradores pueden eliminar eventos' }, { status: 403 });
    }

    const { id } = await params;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Evento eliminado correctamente' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al eliminar evento' }, { status: 500 });
  }
}
