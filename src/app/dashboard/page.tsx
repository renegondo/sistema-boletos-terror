'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Store, 
  Ticket, 
  Calendar, 
  Users, 
  QrCode, 
  DollarSign, 
  TrendingUp, 
  ArrowRight, 
  Send, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  PlusCircle,
  Sparkles,
  CreditCard,
  Building
} from 'lucide-react';
import { User } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setPendingOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data) => {
        if (!data?.user) {
          router.push('/login');
          return;
        }
        setUser(data.user);

        // Fetch pre-registrations and orders
        fetchOrders();

        if (data.user.role === 'vendor') {
          const statsRes = await fetch(`/api/vendors/${data.user.id}/stats`);
          const statsData = await statsRes.json();
          setStats(statsData);
        } else {
          // Admin
          const [eventsRes, vendorsRes] = await Promise.all([
            fetch('/api/events'),
            fetch('/api/vendors'),
          ]);
          const eventsData = await eventsRes.json();
          const vendorsData = await vendorsRes.json();
          setEvents(eventsData.events || []);
          setVendors(vendorsData.vendors || []);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleCompleteOrder = async (orderId: string) => {
    setCompletingId(orderId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/complete`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al completar orden');

      setActionMessage({
        type: 'success',
        text: `¡Orden ${orderId} aprobada! Se generaron los boletos y se despachó el código QR a WhatsApp (+${data.order?.customer_phone || ''}).`,
      });
      fetchOrders();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Error al completar orden',
      });
    } finally {
      setCompletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white font-bold tracking-wider uppercase">
                {user.role === 'admin' ? 'Panel de Administración' : 'Panel de Vendedor / Promotor'}
              </span>
              {user.role === 'vendor' && (
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-400 text-slate-900 font-extrabold">
                  {user.commission_type === 'percentage'
                    ? `Comisión: ${user.commission_rate}% por venta`
                    : `Comisión: $${user.commission_rate} fija por boleto`}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              ¡Hola, {user.name}! 👋
            </h1>
            <p className="text-indigo-100 text-sm max-w-xl font-medium">
              {user.role === 'admin'
                ? 'Monitorea las ventas de taquilla física, ingresos globales, comisiones de vendedores y configuración de WhatsApp.'
                : 'Gestiona tus ventas de boletos en físico, revisa tus ganancias en tiempo real y el desglose de tus comisiones.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-md shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <span>💀 Ver Landing Horror Fest</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/pos"
              className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm shadow-md flex items-center gap-2 transition-all hover:scale-105"
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Abrir Taquilla POS</span>
            </Link>

            {user.role === 'admin' ? (
              <Link
                href="/eventos"
                className="px-4 py-3 rounded-2xl bg-indigo-900/60 hover:bg-indigo-900/80 text-white font-bold text-sm border border-indigo-400/40 flex items-center gap-2 transition-all"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>Nuevo Evento</span>
              </Link>
            ) : (
              <Link
                href="/scanner"
                className="px-4 py-3 rounded-2xl bg-indigo-900/60 hover:bg-indigo-900/80 text-white font-bold text-sm border border-indigo-400/40 flex items-center gap-2 transition-all"
              >
                <QrCode className="w-4 h-4 text-white" />
                <span>Cámara QR</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl text-sm font-semibold flex items-center justify-between gap-3 ${
          actionMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs opacity-70 hover:opacity-100 font-bold">Cerrar</button>
        </div>
      )}

      {/* Online Pre-registrations Management Block */}
      <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
                  Módulo de Pre-registros Landing Page
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {pendingOrders.filter((o) => o.status === 'pending').length} pendientes de pago
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>🎃 Reservas y Pre-registros: Rodada del Terror</span>
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Cuando un usuario aparta boletos en la landing page, aparece aquí con estatus <span className="text-amber-400 font-semibold">Pendiente</span>. Al confirmar su pago por transferencia o efectivo, haz clic en <span className="text-emerald-400 font-bold">&quot;Validar Pago & Enviar QR&quot;</span> para generar su entrada y mandarle su QR directo por WhatsApp.
              </p>
            </div>
            <button
              onClick={fetchOrders}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
            >
              🔄 Actualizar lista
            </button>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-800/40 border border-slate-800 text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-sm">No hay pre-registros pendientes por el momento.</p>
              <p className="text-xs text-slate-500 mt-1">Los apartados realizados en la página de inicio aparecerán aquí en tiempo real.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Folio</th>
                    <th className="pb-3">Cliente</th>
                    <th className="pb-3">WhatsApp</th>
                    <th className="pb-3">Evento & Detalles</th>
                    <th className="pb-3 text-right">Monto Total</th>
                    <th className="pb-3 text-center">Estado</th>
                    <th className="pb-3 text-center">WhatsApp</th>
                    <th className="pb-3 text-right pr-2">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pendingOrders.map((ord) => {
                    let notesData: any = {};
                    try {
                      notesData = ord.notes ? JSON.parse(ord.notes) : {};
                    } catch {}
                    const isPending = ord.status === 'pending';

                    return (
                      <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 pl-2 font-mono font-bold text-xs text-indigo-400">
                          {ord.id}
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-white">{ord.customer_name}</div>
                          {notesData.biker_notes && (
                            <span className="text-[11px] text-amber-300 font-mono">
                              Moto/Club: {notesData.biker_notes}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-slate-300 font-mono text-xs">
                          +{ord.customer_phone}
                        </td>
                        <td className="py-3.5 text-xs text-slate-300">
                          <div className="font-bold text-slate-200">{ord.event_title}</div>
                          <span className="text-slate-400">
                            {notesData.tier_name || 'Boleto'} • {notesData.quantity || ord.ticket_count || 1} boleto(s)
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-mono font-black text-white">
                          ${ord.total_amount?.toFixed(2) || '0.00'} MXN
                        </td>
                        <td className="py-3.5 text-center">
                          {isPending ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Pendiente Pago
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Completado ✓
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          {ord.whatsapp_status === 'sent' ? (
                            <span className="text-[11px] font-bold text-emerald-400">Enviado 🟢</span>
                          ) : ord.whatsapp_status === 'failed' ? (
                            <span className="text-[11px] font-bold text-red-400">Error 🔴</span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400">En espera ⏳</span>
                          )}
                        </td>
                        <td className="py-3.5 text-right pr-2">
                          {isPending ? (
                            <button
                              onClick={() => handleCompleteOrder(ord.id)}
                              disabled={completingId === ord.id}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                            >
                              {completingId === ord.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Validar Pago & Enviar QR</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">
                              {ord.tickets?.length || ord.ticket_count || 1} QR(s) Activos
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* VENDOR VIEW: Personal Metrics & Recent Orders */}
      {user.role === 'vendor' && stats && (
        <div className="space-y-8">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                <span>BOLETOS VENDIDOS</span>
                <Ticket className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                {stats.metrics?.total_tickets_sold || 0}
              </div>
              <span className="text-xs text-slate-500 mt-1 block font-medium">
                en {stats.metrics?.total_orders || 0} ventas registradas
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                <span>INGRESOS RECAUDADOS</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900 font-mono">
                ${(stats.metrics?.total_revenue || 0).toFixed(2)}
              </div>
              <span className="text-xs text-slate-500 mt-1 block font-medium">
                Ventas brutas de taquilla
              </span>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
                <span>TU COMISIÓN GANADA</span>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-indigo-700 font-mono">
                ${(stats.metrics?.total_commissions || 0).toFixed(2)}
              </div>
              <span className="text-xs text-indigo-900/80 mt-1 block font-medium">
                {user.commission_type === 'percentage'
                  ? `${user.commission_rate}% por cada venta`
                  : `$${user.commission_rate} fija por boleto`}
              </span>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                <span>SALDO PENDIENTE POR COBRAR</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-emerald-700 font-mono">
                ${(stats.metrics?.pending_balance || 0).toFixed(2)}
              </div>
              <span className="text-xs text-emerald-900/80 mt-1 block font-medium">
                Liquidado a la fecha: ${(stats.metrics?.total_paid || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Orders History by Vendor */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-600" />
                Mis Ventas Recientes en Taquilla
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                {stats.orders?.length || 0} transacciones
              </span>
            </div>

            {!stats.orders || stats.orders.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                Aún no has registrado ventas. Abre la taquilla POS para empezar a cobrar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3 pl-2">Folio Orden</th>
                      <th className="pb-3">Evento</th>
                      <th className="pb-3">Cliente</th>
                      <th className="pb-3">Teléfono WhatsApp</th>
                      <th className="pb-3 text-center">Boletos</th>
                      <th className="pb-3 text-right">Total Cobrado</th>
                      <th className="pb-3 text-right">Tu Comisión</th>
                      <th className="pb-3 text-center">WhatsApp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.orders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 pl-2 font-mono font-bold text-xs text-indigo-600">
                          {order.id}
                        </td>
                        <td className="py-3.5 text-slate-900 font-bold">
                          {order.event_title}
                        </td>
                        <td className="py-3.5 text-slate-700">
                          {order.customer_name}
                        </td>
                        <td className="py-3.5 text-slate-500 font-mono text-xs">
                          +{order.customer_phone}
                        </td>
                        <td className="py-3.5 text-center font-bold text-slate-900">
                          {order.ticket_count}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-slate-800">
                          ${order.total_amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 text-right font-mono font-black text-emerald-600">
                          +${order.vendor_commission_amount.toFixed(2)}
                        </td>
                        <td className="py-3.5 text-center">
                          {order.whatsapp_status === 'sent' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Enviado 🟢
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN VIEW: Global Metrics, Vendors & Events */}
      {user.role === 'admin' && (
        <div className="space-y-8">
          {(() => {
            const totalTickets = vendors.reduce((acc, v) => acc + (v.total_tickets_sold || 0), 0);
            const totalRevenue = vendors.reduce((acc, v) => acc + (v.total_revenue || 0), 0);
            const totalCommissions = vendors.reduce((acc, v) => acc + (v.total_commissions || 0), 0);
            const netMargin = Math.max(0, totalRevenue - totalCommissions);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                    <span>BOLETOS VENDIDOS GLOBALES</span>
                    <Ticket className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {totalTickets}
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block font-medium">
                    en todos los eventos
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                    <span>INGRESOS BRUTOS DE TAQUILLA</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-emerald-600 font-mono">
                    ${totalRevenue.toFixed(2)}
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block font-medium">
                    Total recaudado
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                    <span>COMISIONES A VENDEDORES</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-3xl font-black text-indigo-700 font-mono">
                    ${totalCommissions.toFixed(2)}
                  </div>
                  <span className="text-xs text-slate-500 mt-1 block font-medium">
                    Total devengado por RPs
                  </span>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
                    <span>MARGEN NETO PRODUCTORA</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-emerald-700 font-mono">
                    ${netMargin.toFixed(2)}
                  </div>
                  <span className="text-xs text-emerald-900/80 mt-1 block font-medium">
                    Ingresos menos comisiones
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Vendors Commissions Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Rendimiento y Comisiones de Vendedores
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Control de comisiones (porcentaje vs monto fijo) y saldos pendientes
                </p>
              </div>
              <Link
                href="/vendedores"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Administrar Vendedores</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Vendedor</th>
                    <th className="pb-3">Contacto</th>
                    <th className="pb-3">Esquema Comisión</th>
                    <th className="pb-3 text-center">Boletos Vendidos</th>
                    <th className="pb-3 text-right">Recaudado</th>
                    <th className="pb-3 text-right">Comisión Ganada</th>
                    <th className="pb-3 text-right">Saldo Pendiente</th>
                    <th className="pb-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 pl-2 font-bold text-slate-900">
                        {v.name}
                      </td>
                      <td className="py-3.5 text-xs text-slate-500 font-mono">
                        {v.phone || v.email}
                      </td>
                      <td className="py-3.5">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                          v.commission_type === 'percentage'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {v.commission_type === 'percentage'
                            ? `${v.commission_rate}% por venta`
                            : `$${v.commission_rate} fija / boleto`}
                        </span>
                      </td>
                      <td className="py-3.5 text-center font-bold text-slate-900 font-mono">
                        {v.total_tickets_sold}
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-slate-800">
                        ${v.total_revenue.toFixed(2)}
                      </td>
                      <td className="py-3.5 text-right font-mono font-black text-indigo-600">
                        ${v.total_commissions.toFixed(2)}
                      </td>
                      <td className="py-3.5 text-right font-mono font-black text-emerald-600">
                        ${v.pending_payout.toFixed(2)}
                      </td>
                      <td className="py-3.5 text-center">
                        <Link
                          href={`/vendedores?vendorId=${v.id}`}
                          className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors inline-block"
                        >
                          Liquidar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Events Overview */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Eventos Registrados
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Cartelera actual y ocupación de taquilla
                </p>
              </div>
              <Link
                href="/eventos"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-base">{evt.title}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                        {evt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      {evt.event_date} a las {evt.event_time} • {evt.location}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Boletos vendidos: <strong className="text-slate-900 font-bold">{evt.total_sold}</strong>
                    </span>
                    <span className="text-emerald-600 font-mono font-black text-sm">
                      ${(evt.total_revenue || 0).toFixed(2)} MXN
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
