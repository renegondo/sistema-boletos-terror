import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, events(title, event_date, event_time, location, banner_url)')
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .eq('order_id', id);

    const { data: allTiers } = await supabase.from('ticket_tiers').select('id, name');
    const tierMap = new Map((allTiers || []).map((t) => [t.id, t.name]));

    const enrichedTickets = (tickets || []).map((t) => ({
      ...t,
      tier_name: tierMap.get(t.tier_id) || 'Boleto',
    }));

    const event = order.events;
    const formattedOrder = {
      ...order,
      event_title: event?.title || 'Horror Fest',
      event_date: event?.event_date || '2026-11-01',
      event_time: event?.event_time || '21:00',
      location: event?.location || 'Salón del Sindicato del IMSS',
      banner_url: event?.banner_url || null,
    };

    return NextResponse.json({ order: formattedOrder, tickets: enrichedTickets });
  } catch (error: any) {
    console.error('Error fetching order by ID:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener orden' }, { status: 500 });
  }
}
