'use client';

import { useState } from 'react';
import { 
  Ticket, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  User, 
  Mail, 
  Send, 
  Copy, 
  ExternalLink, 
  Sparkles,
  ShieldCheck,
  Wine,
  HelpCircle
} from 'lucide-react';

interface TicketTierOption {
  id: string;
  name: string;
  price: number;
  badge: string;
  badgeColor: string;
  features: string[];
  recommended?: boolean;
}

const TICKET_TIERS: TicketTierOption[] = [
  {
    id: 'tier_terror_001',
    name: 'Cover General BYOB (Preventa)',
    price: 150,
    badge: 'PREVENTA ETAPA 1',
    badgeColor: 'bg-red-600 text-white',
    recommended: true,
    features: [
      'Acceso al Salón del Sindicato del IMSS (After Oficial)',
      'Modalidad BYOB: Ingresa tus propias botellas/bebidas sin descorche',
      'Acceso a todos los shows: Vale Queen, DJ Jhonas, DG, Ahuja, DJ Koy, DJ Gato, etc.',
      'Participación en rifas y dinámicas en vivo',
      'Pulsera de seguridad oficial numerada',
    ],
  },
  {
    id: 'tier_terror_002',
    name: 'VIP Horror Lounge',
    price: 450,
    badge: 'EXPERIENCIA VIP',
    badgeColor: 'bg-yellow-500 text-slate-950 font-black',
    features: [
      'Todo lo incluido en Cover General',
      'Zona lounge elevada con vista frontal al escenario',
      'Acceso preferencial sin filas en puerta',
      'Servicio de meseros y barra rápida',
      'Pulsera conmemorativa coleccionable Horror Fest',
    ],
  },
  {
    id: 'tier_terror_003',
    name: 'Biker Pack All Access',
    price: 800,
    badge: 'ALL ACCESS & MOTOS',
    badgeColor: 'bg-purple-600 text-white',
    features: [
      'Todo lo incluido en VIP Horror Lounge',
      'Estacionamiento cerrado y vigilado para tu motocicleta',
      'Acceso hospitality backstage (convivencia con talentos)',
      'Kit conmemorativo: Playera oficial + Stickers biker',
      'Lugar preferente en el contingente de la caravana',
    ],
  },
];

export default function TicketBookingSection() {
  const [selectedTierId, setSelectedTierId] = useState<string>('tier_terror_001');
  const [quantity, setQuantity] = useState<number>(1);
  const [customerName, setCustomerName] = useState('');
  const [countryCode, setCountryCode] = useState('+52');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [bikerClub, setBikerClub] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any | null>(null);
  const [copiedClabe, setCopiedClabe] = useState(false);

  const selectedTier = TICKET_TIERS.find((t) => t.id === selectedTierId) || TICKET_TIERS[0];
  const totalAmount = selectedTier.price * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fullPhone = `${countryCode}${customerPhone.trim()}`;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 'evt_rodada_terror_2026',
          customerName: customerName.trim(),
          customerPhone: fullPhone,
          customerEmail: customerEmail.trim() || undefined,
          tierId: selectedTier.id,
          quantity,
          notes: bikerClub.trim() ? `Club/Moto: ${bikerClub.trim()}` : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al apartar boletos');
      }

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2000);
  };

  return (
    <div id="apartar-boletos" className="relative py-12 scroll-mt-24">
      {/* Decorative heading */}
      <div className="text-center max-w-3xl mx-auto mb-12 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-widest mb-3">
          <Flame className="w-3.5 h-3.5" />
          Aparta tus Boletos Oficiales • Cupo Limitado
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
          ASEGURA TU LUGAR EN EL <span className="text-yellow-400">HORROR FEST</span>
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-3">
          Selecciona tu tipo de pase, registra tus datos y recibe confirmación inmediata por WhatsApp.
          Al validar tu pago, el sistema te emitirá tu <strong className="text-white">Código QR Oficial de Acceso</strong>.
        </p>
      </div>

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 mb-12">
        {TICKET_TIERS.map((tier) => {
          const isSelected = selectedTierId === tier.id;
          return (
            <div
              key={tier.id}
              onClick={() => setSelectedTierId(tier.id)}
              className={`relative rounded-3xl p-6 sm:p-7 cursor-pointer transition-all duration-300 flex flex-col justify-between border ${
                isSelected
                  ? 'bg-[#121118] border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.35)] scale-[1.02] ring-2 ring-red-500/50'
                  : 'bg-[#0b0b10] border-slate-800/80 hover:border-slate-700 hover:bg-[#0f0e15]'
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${tier.badgeColor}`}>
                  {tier.badge}
                </span>
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'border-red-500 bg-red-500 text-white' : 'border-slate-600'
                }`}>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white uppercase">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-yellow-400 font-mono">
                    ${tier.price}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">MXN / boleto</span>
                </div>

                <div className="my-5 h-px bg-slate-800/80" />

                <ul className="space-y-2.5 text-xs text-slate-300">
                  {tier.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-red-500' : 'text-slate-500'}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className={`w-full mt-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                  isSelected
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isSelected ? '✓ Seleccionado' : 'Elegir Pase'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Booking Form Box */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-[#0e0e14] border border-red-950/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-red-500" />
                  Formulario de Pre-registro
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Apartas: <strong className="text-yellow-400">{selectedTier.name}</strong> • ${selectedTier.price} MXN c/u
                </p>
              </div>

              {/* Quantity selector */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="w-8 text-center font-mono font-bold text-white text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-600 text-red-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Roberto Martínez Gómez"
                    className="w-full bg-[#15141c] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Número de WhatsApp (Aquí recibirás tu folio y QR) *
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-[#15141c] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-red-500"
                  >
                    <option value="+52">🇲🇽 +52 (México)</option>
                    <option value="+1">🇺🇸 +1 (USA)</option>
                    <option value="+57">🇨🇴 +57 (Colombia)</option>
                    <option value="+54">🇦🇷 +54 (Argentina)</option>
                  </select>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10 dígitos (ej. 5512345678)"
                      className="w-full bg-[#15141c] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Correo Electrónico (Opcional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full bg-[#15141c] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Club Biker / Modelo Moto (Opcional)
                  </label>
                  <input
                    type="text"
                    value={bikerClub}
                    onChange={(e) => setBikerClub(e.target.value)}
                    placeholder="Ej. Biker Club CDMX / Yamaha R6"
                    className="w-full bg-[#15141c] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Total Calculation pill */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between mt-4">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Total a liquidar:</span>
                  <span className="text-xs text-slate-300">
                    {quantity} boleto(s) × ${selectedTier.price} MXN
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-yellow-400 font-mono">
                    ${totalAmount.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-slate-400 block">MXN</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Apartar Mis Boletos Ahora</span>
                    <Flame className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Success Confirmation Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#100f16] border-2 border-red-500 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-[0_0_60px_rgba(239,68,68,0.5)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <span className="text-xs px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 font-bold uppercase tracking-wider">
                Pre-registro Confirmado 🎃
              </span>

              <h3 className="text-2xl font-black text-white mt-2 uppercase">
                ¡Tus Boletos Están Apartados!
              </h3>

              <p className="text-xs text-slate-300 mt-2">
                Hola <strong className="text-white">{successData.order?.customer_name}</strong>, hemos registrado tu solicitud con folio:
              </p>

              <div className="my-4 p-3 rounded-2xl bg-black/80 border border-red-900/60 font-mono text-lg font-black text-yellow-400 flex items-center justify-center gap-2">
                <span>{successData.order?.id}</span>
              </div>

              {/* Bank Details */}
              <div className="text-left bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 mb-5">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Instrucciones de Pago (Transferencia / STP):
                </div>
                <div className="flex justify-between items-center text-slate-300 pt-1">
                  <span>Banco:</span>
                  <span className="font-bold text-white">BBVA / STP</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>CLABE:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-yellow-300">
                    <span>012180015582910384</span>
                    <button
                      onClick={() => copyToClipboard('012180015582910384')}
                      title="Copiar CLABE"
                      className="p-1 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Beneficiario:</span>
                  <span className="font-bold text-white">Flow Productions</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span>Referencia:</span>
                  <span className="font-mono font-bold text-red-400">{successData.order?.id}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                  <span>Monto Total:</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    ${successData.order?.total_amount?.toFixed(2)} MXN
                  </span>
                </div>
                {copiedClabe && (
                  <p className="text-[11px] text-emerald-400 text-center font-bold">
                    ✓ CLABE copiada al portapapeles
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/40 text-[11px] text-slate-300 text-left mb-5">
                ⚡ <strong>¿Qué sigue?</strong> Cuando el staff verifique tu comprobante de pago en el sistema, recibirás tu <strong>Código QR Digital Oficial</strong> directamente por WhatsApp.
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                {successData.directWhatsAppLink && (
                  <a
                    href={successData.directWhatsAppLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Comprobante por WhatsApp</span>
                  </a>
                )}

                <button
                  onClick={() => setSuccessData(null)}
                  className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
