import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'node:crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase.from('events').select('*');
    if (status) {
      query = query.eq('status', status);
    }
    query = query.order('event_date', { ascending: true });

    const { data: events, error } = await query;
    if (error) throw error;

    const { data: allTiers } = await supabase.from('ticket_tiers').select('*').order('price', { ascending: true });
    const { data: allOrders } = await supabase.from('orders').select('event_id, total_amount');

    const enrichedEvents = (events || []).map((event) => {
      const eventTiers = (allTiers || []).filter((t) => t.event_id === event.id);
      const eventOrders = (allOrders || []).filter((o) => o.event_id === event.id);

      const totalRevenue = eventOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

      return {
        ...event,
        tiers: eventTiers,
        total_sold: eventOrders.length,
        total_revenue: totalRevenue,
      };
    });

    return NextResponse.json({ events: enrichedEvents });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener eventos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden crear eventos' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, location, event_date, event_time, banner_url, tiers } = body;

    if (!title || !location || !event_date || !event_time) {
      return NextResponse.json({ error: 'Título, ubicación, fecha y hora son obligatorios' }, { status: 400 });
    }

    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
      return NextResponse.json({ error: 'Debes definir al menos un tipo de boleto' }, { status: 400 });
    }

    const eventId = `evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const { error: eventError } = await supabase.from('events').insert({
      id: eventId,
      title,
      description: description || null,
      location,
      event_date,
      event_time,
      banner_url: banner_url || null,
      status: 'active',
    });

    if (eventError) throw eventError;

    for (const tier of tiers) {
      const tierId = `tier_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      await supabase.from('ticket_tiers').insert({
        id: tierId,
        event_id: eventId,
        name: tier.name,
        price: Number(tier.price) || 0,
        capacity: Number(tier.capacity) || 100,
        sold_count: 0,
        description: tier.description || null,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Evento creado exitosamente',
      eventId,
    });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: error.message || 'Error al crear evento' }, { status: 500 });
  }
}
