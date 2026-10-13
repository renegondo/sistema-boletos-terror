'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skull, Flame, Calendar, Clock, MapPin, Wine, Search, User, Phone, CheckCircle2, AlertCircle, Copy, Send, ShieldCheck, Tag, Lock } from 'lucide-react';
import TicketTrackerModal from '@/components/TicketTrackerModal';

export default function HorrorFestLandingPage() {
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [globalLightning, setGlobalLightning] = useState(false);
  const [introDismissed, setIntroDismissed] = useState(false);

  // Booking Form State
  const [tierType, setTierType] = useState<'general' | 'vip'>('general');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [countryCode, setCountryCode] = useState('+52');
  const [customerPhone, setCustomerPhone] = useState('');
  const [rpCode, setRpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any | null>(null);
  const [copiedClabe, setCopiedClabe] = useState(false);
  const [eventData, setEventData] = useState<any>(null);

  // Load live event tier data (synced with DB)
  useEffect(() => {
    fetch('/api/events/evt_rodada_terror_2026')
      .then((res) => res.json())
      .then((data) => {
        if (data?.event) setEventData(data.event);
      })
      .catch(() => {});
  }, []);

  // Random Ambient Lightning
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.65) {
        setGlobalLightning(true);
        setTimeout(() => setGlobalLightning(false), 180);
      }
    }, 4500);

    // Read RP code from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('rp')) {
        setRpCode(params.get('rp') || '');
      }
    }

    return () => clearInterval(interval);
  }, []);

  // Intro splash screen handling
  useEffect(() => {
    const handleDismiss = (e: Event) => {
      // Prevent the interaction that dismisses the splash from scrolling the page
      if (e.cancelable) {
        e.preventDefault();
      }
      setIntroDismissed(true);
    };

    window.addEventListener('wheel', handleDismiss, { once: true, passive: false });
    window.addEventListener('touchmove', handleDismiss, { once: true, passive: false });
    window.addEventListener('click', handleDismiss, { once: true });

    return () => {
      window.removeEventListener('wheel', handleDismiss);
      window.removeEventListener('touchmove', handleDismiss);
      window.removeEventListener('click', handleDismiss);
    };
  }, []);

  useEffect(() => {
    if (!introDismissed) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.width = '100%';
    } else {
      setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, 0);
      }, 1500);
    }
    return () => { 
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [introDismissed]);

  const tierPrice = 150;
  const tierName = 'Cover General BYOB (Preventa Etapa 1)';
  const tierId = 'tier_terror_001';
  const totalAmount = tierPrice * quantity;

  const handleBookingSubmit = async (e: React.FormEvent) => {
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
          tierId,
          quantity,
          rpCode: rpCode.trim(),
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
    <div className="relative min-h-[100dvh] bg-[#020202] text-slate-100 overflow-x-hidden selection:bg-red-600 selection:text-white font-sans">
      
      {/* DEMON INTRO SPLASH SCREEN */}
      <div 
        className={`fixed inset-0 z-[100] bg-black flex items-center justify-center transition-all duration-[1500ms] ease-[cubic-bezier(0.64,0,0.78,0)] ${
          introDismissed ? 'opacity-0 scale-[4] pointer-events-none' : 'opacity-100 scale-100'
        }`}
      >
        <Image 
          src="/images/intro-demon.webp" 
          alt="Demon Intro" 
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-90 mix-blend-screen grayscale"
        />
        
        {/* Gradient Color Filter Overlay (Amarillo -> Rojo -> Morado) */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-600 to-purple-800 mix-blend-multiply opacity-80 animate-gradient" />
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-red-600 to-purple-900 mix-blend-color opacity-90 animate-gradient" />

        <div className={`absolute bottom-16 z-10 text-yellow-400 font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] transition-opacity duration-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] ${introDismissed ? 'opacity-0' : 'animate-pulse'}`}>
          [ Interactúa para entrar ]
        </div>
      </div>

      {/* IMMERSIVE BACKGROUND ARTWORK (Gran Flyer Concept) */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0a0505]">
        {/* Main Artwork - Treated to look cinematic and blend with the background */}
        <div 
          className="absolute inset-0 w-full h-full opacity-50 bg-[url('/images/parallax-bg.png')] bg-cover bg-center bg-no-repeat z-0"
        />
        
        {/* Vignette and depth fog (renders OVER the image to give depth) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,2,2,0.95)_100%)] z-10" />
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black to-transparent z-10" />
        <div className="absolute bottom-0 inset-x-0 h-[50vh] bg-gradient-to-t from-black via-[#050000]/80 to-transparent z-10" />
      </div>

      {/* CRT OVERLAY & LIGHTNING */}
      <div className="horror-glitch-overlay fixed inset-0 z-10 opacity-60" />
      <div 
        className={`fixed inset-0 z-20 pointer-events-none mix-blend-overlay transition-opacity duration-75 ${
          globalLightning ? 'bg-white opacity-100' : 'opacity-0'
        }`} 
      />

      {/* CONTENT: THE DIGITAL FLYER */}
      <main className="relative z-30 flex flex-col items-center min-h-[100dvh] pt-8 pb-32 px-5 sm:px-8 w-full max-w-lg mx-auto lg:max-w-3xl">
        
        {/* Header Strip */}
        <div className="w-full flex justify-between items-center mb-16 sm:mb-20">
          <div className="text-red-600 font-mono text-[9px] sm:text-[10px] font-black tracking-[0.3em] uppercase">
            Flow Productions Presenta
          </div>
          <button
            onClick={() => setIsTrackerOpen(true)}
            className="horror-glitch-text text-yellow-500 font-mono text-[10px] font-black tracking-widest uppercase hover:text-red-500 transition-colors"
          >
            [ Consultar QR ]
          </button>
        </div>

        {/* MASSIVE LOGO HERO */}
        <div className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto mb-12 sm:mb-16">
          {/* Background and Foreground Logos */}
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] flex items-center justify-center group">
            
            {/* Background Logo */}
            <Image 
              src="/images/logo-fondo.png" 
              alt="Horror Fest Logo Background" 
              fill
              priority
              sizes="(max-width: 768px) 100vw, 800px"
              className="horror-logo-fx object-contain mix-blend-lighten"
            />
            
            {/* Foreground Banner Overlay */}
            <Image 
              src="/images/banner-rojo.png" 
              alt="Terror Banner Foreground" 
              fill
              priority
              sizes="(max-width: 768px) 80vw, 600px"
              className="horror-img-glitch !w-[80%] !h-[80%] m-auto object-contain z-10 group-hover:scale-[0.82] group-hover:-translate-y-2 transition-all duration-700 ease-out filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.9)]"
            />
          </div>

          {/* Emblem / Date Location Badge */}
          <div className="relative z-20 -mt-8 sm:-mt-12 w-[90%] max-w-[400px] hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]">
            <Image 
              src="/images/fecha-lugar.png" 
              alt="Domingo 1 Nov 2026 - Salon Casino" 
              width={400}
              height={120}
              priority
              style={{ width: '100%', height: 'auto' }}
              className="object-contain"
            />
          </div>
        </div>

        {/* HIGH-IMPACT LINEUP (BLURRED / FASE SECRETA) */}
        <div className="w-full text-center mb-16 sm:mb-24 relative z-20">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-red-600"></div>
            <h3 className="text-[10px] sm:text-xs font-mono font-black text-red-500 tracking-[0.3em] uppercase">
              Lineup Estelar • Fase Secreta
            </h3>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-red-600"></div>
          </div>

          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-red-900/40 bg-black/40 backdrop-blur-sm">
            {/* Mystery Overlay Badge */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] p-6 text-center">
              <div className="flex items-center gap-2 border border-red-500/60 bg-red-950/80 text-red-200 font-mono text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] px-4 py-2 rounded-full shadow-[0_0_25px_rgba(220,38,38,0.5)] animate-pulse">
                <Lock className="w-3.5 h-3.5 text-red-400" />
                <span>Lineup Confidencial</span>
              </div>
              <h4 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mt-4 horror-glitch-text">
                Por Revelar
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-300 font-mono tracking-widest uppercase mt-2 max-w-md">
                Artistas sorpresa, headliners urbanos & DJs estelares
              </p>
              <div className="mt-4 text-[10px] font-mono text-yellow-500/90 tracking-widest uppercase border border-yellow-500/30 bg-yellow-950/30 px-3 py-1 rounded-md">
                ⚡ Preventa disponible antes de la revelación oficial ⚡
              </div>
            </div>

            {/* Blurred Lineup Content */}
            <div className="filter blur-md select-none pointer-events-none opacity-30 flex flex-col items-center gap-6">
              {/* Headliners */}
              <div className="flex flex-col items-center gap-0">
                <div className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  Vale Queen
                </div>
                <div className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-500 uppercase tracking-tighter mt-[-2%]">
                  DJ Jhonas <span className="text-lg sm:text-2xl text-slate-500 font-bold tracking-normal align-top"></span>
                </div>
              </div>

              {/* Sub-headliners / Acts */}
              <div className="w-full max-w-lg mt-4 flex flex-col items-center">
                <span className="text-[9px] font-mono font-bold text-red-500/80 uppercase tracking-widest mb-2 border border-red-900/40 px-3 py-1 rounded-full bg-black/40">
                  Show Urbano & Trap
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-300 uppercase tracking-tight flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
                  <span>Dege</span>
                  <span className="text-red-900 text-sm">/</span>
                  <span>Pasatiempo</span>
                  <span className="text-red-900 text-sm">/</span>
                  <span>El Bala</span>
                </div>
              </div>

              <div className="w-full max-w-lg mt-2 flex flex-col items-center">
                <span className="text-[9px] font-mono font-bold text-red-500/80 uppercase tracking-widest mb-2 border border-red-900/40 px-3 py-1 rounded-full bg-black/40">
                  Club & Performance
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-300 uppercase tracking-tight flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
                  <span>DJ Fragot</span>
                  <span className="text-red-900 text-sm">/</span>
                  <span className="flex items-center gap-2">
                    Los Babys
                    <span className="text-[10px] sm:text-xs text-red-500 tracking-widest font-mono border border-red-500/30 px-1.5 py-0.5 rounded-sm">Gogos Show</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EVENT DETAILS STRIP */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-10 w-full mb-16 font-mono text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest border-y border-white/5 py-6 bg-black/30 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-600" />
            <span>1 Nov 2026</span>
          </div>
          <div className="hidden sm:block text-red-900/50">|</div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>Salón Casino</span>
          </div>
          <div className="hidden sm:block text-red-900/50">|</div>
          <div className="flex items-center gap-2">
            <Wine className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-400">BYOB Libre</span>
          </div>
        </div>

        {/* TICKETING TERMINAL */}
        <div id="tickets" className="w-full relative group">
          {/* Ambient Glow behind terminal */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          
          <div className="relative bg-black/80 backdrop-blur-2xl border border-red-900/40 rounded-2xl p-6 sm:p-8 overflow-hidden">
            {/* Top Red Bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-900 via-red-500 to-red-900" />
            
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight horror-glitch-text">
                Asegura tu Acceso
              </h2>
              <p className="text-[11px] font-mono text-red-400 uppercase tracking-widest mt-2">
                Folio Digital Directo a WhatsApp
              </p>
            </div>

            {/* Single Tier Configuration */}
            <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/20 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase text-red-400 font-mono tracking-widest block mb-1">
                  Preventa • Etapa 1
                </span>
                <span className="text-white font-black text-sm">Cover BYOB Libre</span>
              </div>
              <div className="text-yellow-500 font-mono font-black text-lg">
                $150 <span className="text-[10px]">MXN</span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-950/50 border border-red-900 text-red-300 text-xs font-semibold flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-5">
              {/* Quantity */}
              <div className="flex items-center justify-between bg-[#0a0a0f] border border-slate-800/50 rounded-xl p-3">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">
                  Cantidad
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="horror-btn w-8 h-8 rounded-lg bg-black border border-slate-800 text-slate-400 hover:text-white hover:border-red-500 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-mono font-black text-white text-base">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="horror-btn w-8 h-8 rounded-lg bg-black border border-slate-800 text-slate-400 hover:text-white hover:border-red-500 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="relative">
                <User className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre Completo"
                  className="horror-input w-full bg-[#0a0a0f] border-slate-800/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 font-bold"
                />
              </div>

              {/* WhatsApp */}
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="horror-input bg-[#0a0a0f] border-slate-800/50 rounded-xl px-3 py-3.5 text-xs text-slate-300 font-mono font-bold w-24"
                >
                  <option value="+52">+52</option>
                  <option value="+1">+1</option>
                  <option value="+57">+57</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="WhatsApp a 10 dígitos"
                    className="horror-input w-full bg-[#0a0a0f] border-slate-800/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white font-mono placeholder-slate-600 font-bold"
                  />
                </div>
              </div>

              {/* RP Code / Promo */}
              <div className="relative">
                <Tag className="w-4 h-4 text-amber-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rpCode}
                  onChange={(e) => setRpCode(e.target.value)}
                  placeholder="Código RP (Opcional)"
                  className="horror-input w-full bg-[#0a0a0f] border-slate-800/50 rounded-xl pl-11 pr-4 py-3.5 text-sm text-amber-500 placeholder-slate-600 font-bold uppercase tracking-widest"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="horror-btn horror-btn-primary w-full mt-4 py-4 px-6 rounded-xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="horror-glitch-text">Pre-Registrar (${totalAmount} MXN)</span>
                    <Flame className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </main>

      {/* CONFIRMATION MODAL */}
      {/* CONFIRMATION MODAL */}
      {successData && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in">
          
          <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
            
            {/* Horizontal Swipeable Tickets */}
            {successData.tickets && successData.tickets.length > 0 && (
              <div className="flex w-full overflow-x-auto snap-x snap-mandatory gap-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {successData.tickets.map((tkt: any, idx: number) => (
                  <div key={tkt.code} className="snap-center shrink-0 w-full relative flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={tkt.image} 
                      alt={`Boleto ${tkt.code}`} 
                      className="w-[90%] max-h-[70vh] object-contain rounded-[2rem] shadow-[0_0_50px_rgba(220,38,38,0.3)] border border-red-900/30" 
                    />
                  </div>
                ))}
              </div>
            )}

            {successData.tickets && successData.tickets.length > 1 && (
              <div className="flex gap-1.5 justify-center mb-6">
                {successData.tickets.map((_: any, idx: number) => (
                  <div key={idx} className="w-1.5 h-1.5 rounded-full bg-red-600/50" />
                ))}
              </div>
            )}

            {/* Bottom Action Bar */}
            <div className="w-[90%] bg-[#0a0a0f]/80 backdrop-blur-md p-5 rounded-3xl border border-red-900/50 text-center shadow-2xl">
              <h3 className="text-white text-sm font-black uppercase mb-1 tracking-wider">¡Pre-registro Exitoso!</h3>
              <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
                Tus accesos están pendientes de pago. Enviaremos tus boletos a WhatsApp para que los valides en puerta.
              </p>
              
              <button
                onClick={() => setSuccessData(null)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-900 to-red-950 text-white font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all"
              >
                Cerrar y Volver
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TRACKER MODAL */}
      <TicketTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />
    </div>
  );
}
