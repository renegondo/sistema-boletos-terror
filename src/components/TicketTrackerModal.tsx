'use client';

import { useState } from 'react';
import { 
  Search, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Download, 
  Send, 
  X, 
  Ticket as TicketIcon,
  Phone,
  ArrowRight,
  Copy,
  MessageCircle
} from 'lucide-react';

interface TicketTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TicketTrackerModal({ isOpen, onClose }: TicketTrackerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchedOrders, setSearchedOrders] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [selectedTicketQr, setSelectedTicketQr] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');
    setSearchedOrders(null);

    try {
      // Search by phone or orderId
      const isOrderId = searchTerm.trim().toUpperCase().startsWith('ORD');
      const param = isOrderId ? `orderId=${encodeURIComponent(searchTerm.trim())}` : `phone=${encodeURIComponent(searchTerm.trim())}`;
      const res = await fetch(`/api/orders?${param}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al buscar orden');

      if (!data.orders || data.orders.length === 0) {
        setError('No encontramos ninguna reserva con ese folio o teléfono. Verifica los datos.');
      } else {
        setSearchedOrders(data.orders);
      }
    } catch (err: any) {
      setError(err.message || 'Error al consultar boletos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0f0e15] border border-red-900/60 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 text-red-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                Consulta tu Reserva & Boletos QR
              </h3>
              <p className="text-xs text-slate-400">
                Ingresa tu número de WhatsApp o Folio de Pre-registro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearch} className="my-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej. 5512345678 o ORD-PR-..."
              className="w-full bg-[#181722] border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Buscar</span>
            )}
          </button>
        </form>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/60 border border-red-700 text-red-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {searchedOrders && searchedOrders.map((ord) => {
            const isCompleted = ord.status === 'completed';
            const isPending = ord.status === 'pending';

            return (
              <div
                key={ord.id}
                className="p-5 rounded-2xl bg-[#14131d] border border-slate-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono">Folio: {ord.id}</span>
                    <h4 className="text-base font-black text-white">{ord.customer_name}</h4>
                  </div>
                  <div>
                    {isCompleted ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Acceso Confirmado • QR Emitido
                      </span>
                    ) : isPending ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Pre-registro Pendiente de Validación
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
                        {ord.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Evento:</span>
                    <span className="font-bold text-slate-200">{ord.event_title}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Fecha:</span>
                    <span className="font-bold text-slate-200">{ord.event_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Lugar:</span>
                    <span className="font-bold text-slate-200">{ord.location}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Total:</span>
                    <span className="font-bold text-yellow-400 font-mono">${ord.total_amount?.toFixed(2)} MXN</span>
                  </div>
                </div>

                {/* If completed: show QR tickets */}
                {isCompleted && ord.tickets && ord.tickets.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-emerald-400 block mb-2">
                      🎟️ Tus Boletos Digitales ({ord.tickets.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ord.tickets.map((tkt: any) => (
                        <div
                          key={tkt.id}
                          className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between gap-3"
                        >
                          <div>
                            <span className="text-[11px] font-mono font-bold text-red-400 block">
                              {tkt.ticket_code}
                            </span>
                            <span className="text-xs font-bold text-white block">
                              {tkt.attendee_name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {tkt.tier_name || 'General'}
                            </span>
                          </div>

                          <a
                            href={`/api/tickets/${tkt.ticket_code}/image`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>Ver QR</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* If pending: show instructions to pay in cash */}
                {isPending && (
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-900/60 text-xs text-amber-200 space-y-2">
                    <p className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Pre-registro Confirmado • Pago en Efectivo</span>
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      Tu lugar está apartado. El cobro se realiza <strong>únicamente en efectivo</strong> al ingresar en taquilla o con tu RP asignado.
                    </p>
                    <div className="flex justify-between items-center text-slate-400 font-mono text-[11px] pt-1 border-t border-slate-800">
                      <span>Total a Liquidar:</span>
                      <strong className="text-emerald-400 font-bold">${ord.total_amount?.toFixed(2)} MXN</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-400 font-mono text-[11px]">
                      <span>Folio de Reserva:</span>
                      <strong className="text-red-400 font-bold">{ord.id}</strong>
                    </div>

                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                        `Hola, tengo mi pre-registro para Horror Fest 2026.\nFolio: ${ord.id}\nNombre: ${ord.customer_name}\nTotal en efectivo: $${ord.total_amount} MXN\nPagaré en taquilla / con mi RP.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Contactar por WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
