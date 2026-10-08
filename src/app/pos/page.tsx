'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  Calendar, 
  Ticket, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Download, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  QrCode,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowRight,
  Eye
} from 'lucide-react';
import { EventItem, TicketTier, User as UserType } from '@/types';

export default function POSPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  
  // Buyer form
  const [customerName, setCustomerName] = useState('');
  const [countryCode, setCountryCode] = useState('+52');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [cashGiven, setCashGiven] = useState<string>('');

  // Processing state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');

  // Result modal
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [selectedTicketPreview, setSelectedTicketPreview] = useState<string | null>(null);
  const [resendingWhatsapp, setResendingWhatsapp] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/events?status=active').then(r => r.ok ? r.json() : null)
    ]).then(([userData, eventsData]) => {
      if (!userData?.user) {
        router.push('/login');
        return;
      }
      setCurrentUser(userData.user);

      if (eventsData?.events && eventsData.events.length > 0) {
        setEvents(eventsData.events);
        setSelectedEventId(eventsData.events[0].id);
      }
    }).finally(() => setLoading(false));
  }, [router]);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleQuantityChange = (tierId: string, delta: number) => {
    setTicketQuantities(prev => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [tierId]: next };
    });
  };

  // Calculations
  let totalTicketCount = 0;
  let totalAmount = 0;

  if (selectedEvent && selectedEvent.tiers) {
    for (const tier of selectedEvent.tiers) {
      const qty = ticketQuantities[tier.id] || 0;
      totalTicketCount += qty;
      totalAmount += qty * tier.price;
    }
  }

  // Seller commission calculation
  let estimatedCommission = 0;
  if (currentUser) {
    if (currentUser.commission_type === 'percentage') {
      estimatedCommission = (totalAmount * currentUser.commission_rate) / 100;
    } else {
      estimatedCommission = currentUser.commission_rate * totalTicketCount;
    }
  }

  const changeDue = paymentMethod === 'cash' && Number(cashGiven) >= totalAmount 
    ? Number(cashGiven) - totalAmount 
    : 0;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (totalTicketCount === 0) {
      setError('Selecciona al menos 1 boleto para vender.');
      return;
    }

    if (!customerName.trim() || !phoneRaw.trim()) {
      setError('Nombre del cliente y teléfono son requeridos.');
      return;
    }

    const fullPhone = `${countryCode.replace('+', '')}${phoneRaw.replace(/\D/g, '')}`;
    if (fullPhone.length < 10) {
      setError('Ingresa un número de WhatsApp válido.');
      return;
    }

    setSubmitting(true);
    setStatusText('Generando folios y boletos con QR...');

    try {
      const items = (selectedEvent?.tiers || [])
        .filter(t => (ticketQuantities[t.id] || 0) > 0)
        .map(t => ({
          tierId: t.id,
          quantity: ticketQuantities[t.id],
        }));

      const response = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: selectedEventId,
          customerName: customerName.trim(),
          customerPhone: fullPhone,
          customerEmail: customerEmail.trim() || undefined,
          paymentMethod,
          items,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar la venta.');
      }

      setCompletedOrder(result.order);
      if (result.order.tickets && result.order.tickets.length > 0) {
        setSelectedTicketPreview(result.order.tickets[0].ticket_code);
      }

      // Refresh event tiers
      const updatedEventsRes = await fetch('/api/events?status=active');
      const updatedEventsData = await updatedEventsRes.json();
      if (updatedEventsData?.events) {
        setEvents(updatedEventsData.events);
      }

    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setSubmitting(false);
      setStatusText('');
    }
  };

  const handleDownloadTicket = (ticketCode: string) => {
    const link = document.createElement('a');
    link.href = `/api/tickets/${ticketCode}/image`;
    link.download = `Boleto-${ticketCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResendWhatsapp = async (ticketCode: string) => {
    setResendingWhatsapp(ticketCode);
    try {
      const res = await fetch(`/api/tickets/${ticketCode}/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: completedOrder.customer_phone,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(`Error al enviar por WhatsApp: ${data.error || 'Revisa tu configuración de Evolution API'}`);
      } else {
        alert(`✅ ¡Boleto enviado con éxito por WhatsApp a +${completedOrder.customer_phone}!`);
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
    } finally {
      setResendingWhatsapp(null);
    }
  };

  const resetFormForNewSale = () => {
    setCompletedOrder(null);
    setSelectedTicketPreview(null);
    setTicketQuantities({});
    setCustomerName('');
    setPhoneRaw('');
    setCustomerEmail('');
    setCashGiven('');
    setError('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            Punto de Venta Físico (Taquilla)
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Venta presencial de boletos, generación inmediata de imagen con código QR y despacho por WhatsApp.
          </p>
        </div>

        {currentUser && (
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-semibold">Vendedor activo</span>
              <span className="text-sm font-bold text-slate-800">{currentUser.name}</span>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 block">
                {currentUser.commission_type === 'percentage'
                  ? `${currentUser.commission_rate}% comisión`
                  : `$${currentUser.commission_rate} fija/boleto`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Event & Ticket Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Select Event */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-black">1</span>
                Seleccionar Evento
              </h2>
              <span className="text-xs text-slate-400 font-semibold">{events.length} activos</span>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                No hay eventos activos. Da de alta un evento en el panel de eventos.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {events.map((evt) => {
                  const isSelected = evt.id === selectedEventId;
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => {
                        setSelectedEventId(evt.id);
                        setTicketQuantities({});
                      }}
                      className={`text-left p-4 rounded-2xl border transition-all flex items-start justify-between ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-400 shadow-xs'
                          : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className={`font-bold text-sm ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                          {evt.title}
                        </span>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            {evt.event_date} a las {evt.event_time}
                          </span>
                          <span>•</span>
                          <span className="truncate max-w-[240px]">{evt.location}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Select Tickets / Tiers */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-black">2</span>
                Tipos de Entrada & Cantidad
              </h2>
              <span className="text-xs text-slate-400 font-semibold">Precios en MXN</span>
            </div>

            {selectedEvent?.tiers && selectedEvent.tiers.length > 0 ? (
              <div className="space-y-3">
                {selectedEvent.tiers.map((tier) => {
                  const qty = ticketQuantities[tier.id] || 0;
                  const available = Math.max(0, tier.capacity - tier.sold_count);
                  const isSoldOut = available <= 0;

                  return (
                    <div
                      key={tier.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        qty > 0
                          ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base">{tier.name}</span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white text-slate-700 font-mono font-bold border border-slate-200">
                            ${tier.price.toFixed(2)}
                          </span>
                        </div>
                        {tier.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{tier.description}</p>
                        )}
                        <p className="text-[11px] text-slate-400 mt-1 font-medium">
                          {isSoldOut ? (
                            <span className="text-red-600 font-bold">AGOTADO</span>
                          ) : (
                            `${available} boletos disponibles de ${tier.capacity}`
                          )}
                        </p>
                      </div>

                      {/* Counter */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <button
                          type="button"
                          disabled={qty === 0 || isSoldOut}
                          onClick={() => handleQuantityChange(tier.id, -1)}
                          className="w-9 h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center font-bold transition-all shadow-xs"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-extrabold text-lg text-slate-900 font-mono">
                          {qty}
                        </span>
                        <button
                          type="button"
                          disabled={isSoldOut || qty >= available}
                          onClick={() => handleQuantityChange(tier.id, 1)}
                          className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-bold transition-all shadow-xs"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-slate-400 text-center py-6">
                Este evento no tiene tipos de boletos configurados.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Buyer Info & Checkout */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSubmitOrder} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-black">3</span>
              Datos del Comprador & Cobro
            </h2>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Nombre del Titular del Boleto *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Ej: Sofía Martínez"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* WhatsApp Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Teléfono WhatsApp *</span>
                <span className="text-[10px] text-emerald-600 font-bold lowercase">recibirá el boleto con QR</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="+52">🇲🇽 +52 (MX)</option>
                  <option value="+1">🇺🇸 +1 (US)</option>
                  <option value="+57">🇨🇴 +57 (CO)</option>
                  <option value="+34">🇪🇸 +34 (ES)</option>
                  <option value="+54">🇦🇷 +54 (AR)</option>
                  <option value="+56">🇨🇱 +56 (CL)</option>
                  <option value="+51">🇵🇪 +51 (PE)</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phoneRaw}
                    onChange={e => setPhoneRaw(e.target.value)}
                    placeholder="55 1234 5678"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Correo Electrónico (Opcional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                Método de Cobro Físico
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Terminal
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                    paymentMethod === 'transfer'
                      ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Transferencia
                </button>
              </div>
            </div>

            {/* Cash Calculator */}
            {paymentMethod === 'cash' && totalAmount > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-600">Efectivo recibido:</span>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={e => setCashGiven(e.target.value)}
                    placeholder={`$${totalAmount}`}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-right text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
                {Number(cashGiven) >= totalAmount && (
                  <div className="flex items-center justify-between text-xs font-bold pt-1.5 border-t border-slate-200 text-emerald-700">
                    <span>Cambio a devolver:</span>
                    <span className="font-mono text-sm">${changeDue.toFixed(2)} MXN</span>
                  </div>
                )}
              </div>
            )}

            {/* Summary & Seller Commission Box */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-500 text-xs font-medium">
                <span>Boletos seleccionados:</span>
                <span className="font-mono font-bold text-slate-900">{totalTicketCount}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-700 font-bold">Total a Cobrar:</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">
                  ${totalAmount.toFixed(2)} <span className="text-xs text-slate-500 font-normal">MXN</span>
                </span>
              </div>

              {/* Commission Badge */}
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-indigo-700 block font-bold uppercase tracking-wider">Tu comisión por esta venta:</span>
                  <span className="text-xs text-indigo-900/80 font-medium">
                    {currentUser?.commission_type === 'percentage'
                      ? `${currentUser?.commission_rate}% de $${totalAmount.toFixed(2)}`
                      : `$${currentUser?.commission_rate} fija x ${totalTicketCount} boletos`}
                  </span>
                </div>
                <span className="text-lg font-black text-indigo-700 font-mono">
                  +${estimatedCommission.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || totalTicketCount === 0}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-xs">{statusText || 'Procesando...'}</span>
                </div>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  <span>Cobrar y Generar Boletos con QR</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* SUCCESS MODAL: Real Ticket with Visible QR & WhatsApp Status */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">¡Venta de Taquilla Completada!</h2>
              <p className="text-sm text-slate-500 mt-1">
                Orden <span className="font-mono text-indigo-600 font-bold">#{completedOrder.id}</span> • {completedOrder.total_tickets} boleto(s) emitido(s)
              </p>
            </div>

            {/* WhatsApp Notification Banner */}
            <div className={`p-4 rounded-2xl mb-6 border flex items-center justify-between ${
              completedOrder.whatsapp_status === 'sent'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <div className="flex items-center gap-3">
                <Send className={`w-5 h-5 shrink-0 ${completedOrder.whatsapp_status === 'sent' ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div>
                  <span className="font-bold text-sm block">
                    {completedOrder.whatsapp_status === 'sent'
                      ? 'Boleto(s) enviados con éxito por WhatsApp'
                      : 'WhatsApp: Envío automático pendiente'}
                  </span>
                  <span className="text-xs opacity-90">
                    Destinatario: +{completedOrder.customer_phone}
                  </span>
                </div>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                completedOrder.whatsapp_status === 'sent'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}>
                {completedOrder.whatsapp_status === 'sent' ? 'Enviado 🟢' : 'Listo para enviar'}
              </span>
            </div>

            {/* Live Visual Ticket Preview (REAL IMAGE WITH QR CODE) */}
            {selectedTicketPreview && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-3">
                  Vista Previa del Boleto Digital con Código QR:
                </span>

                <div className="inline-block rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white max-w-xs">
                  <img
                    src={`/api/tickets/${selectedTicketPreview}/image?t=${Date.now()}`}
                    alt="Boleto Digital"
                    className="w-full h-auto block"
                  />
                </div>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadTicket(selectedTicketPreview)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    Descargar Boleto PNG
                  </button>

                  <button
                    type="button"
                    disabled={resendingWhatsapp === selectedTicketPreview}
                    onClick={() => handleResendWhatsapp(selectedTicketPreview)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {resendingWhatsapp === selectedTicketPreview ? 'Enviando...' : 'Reenviar WhatsApp'}
                  </button>
                </div>
              </div>
            )}

            {/* Selector if multiple tickets in order */}
            {completedOrder.tickets.length > 1 && (
              <div className="mb-6 space-y-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Boletos Emitidos en esta Venta ({completedOrder.tickets.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {completedOrder.tickets.map((tkt: any) => (
                    <button
                      key={tkt.ticket_code}
                      type="button"
                      onClick={() => setSelectedTicketPreview(tkt.ticket_code)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                        selectedTicketPreview === tkt.ticket_code
                          ? 'bg-indigo-50 border-indigo-500 font-bold text-indigo-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <span className="font-mono">{tkt.ticket_code}</span>
                        <p className="text-[11px] text-slate-500 font-normal">{tkt.attendee_name} • {tkt.tier_name}</p>
                      </div>
                      <Eye className="w-4 h-4 text-indigo-600" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Commission summary */}
            <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-200 mb-6 flex items-center justify-between text-sm">
              <div>
                <span className="text-xs text-indigo-700 font-bold block uppercase tracking-wider">Tu comisión ganada:</span>
                <span className="text-xl font-black text-indigo-900 font-mono">
                  +${completedOrder.vendor_commission_amount.toFixed(2)} MXN
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total cobrado:</span>
                <span className="text-base font-extrabold text-slate-800 font-mono">
                  ${completedOrder.total_amount.toFixed(2)} MXN
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={resetFormForNewSale}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                Nueva Venta en Taquilla
              </button>

              <button
                type="button"
                onClick={() => router.push('/')}
                className="py-3 px-4 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
