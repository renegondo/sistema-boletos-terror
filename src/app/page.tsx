'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skull, Flame, Calendar, Clock, MapPin, Wine, Search, User, Phone, CheckCircle2, AlertCircle, Copy, Send, ShieldCheck, Tag, Lock, Download, MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import TicketTrackerModal from '@/components/TicketTrackerModal';

export const dynamic = 'force-dynamic';

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
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);
  const [eventData, setEventData] = useState<any>(null);

  // Load live event tier data (synced with DB, no-store cache)
  useEffect(() => {
    fetch('/api/events?status=active', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        const active = data?.events?.[0];
        if (active) {
          setEventData(active);
          if (active.tiers && active.tiers.length > 0) {
            setSelectedTierId(active.tiers[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback to direct event query
        fetch('/api/events/evt_rodada_terror_2026', { cache: 'no-store' })
          .then((res) => res.json())
          .then((data) => {
            if (data?.event) setEventData(data.event);
          })
          .catch(() => {});
      });
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

  const [selectedTierId, setSelectedTierId] = useState<string>('tier_terror_001');

  const tiersList = eventData?.tiers && eventData.tiers.length > 0 ? eventData.tiers : [
    {
      id: 'tier_terror_001',
      name: 'Cover General BYOB (Preventa Etapa 1)',
      price: 150,
      badge: 'Preventa Etapa 1',
    },
    {
      id: 'tier_terror_002',
      name: 'VIP Horror Lounge & Terraza',
      price: 450,
      badge: 'VIP Exclusivo',
    },
    {
      id: 'tier_terror_003',
      name: 'Biker Pack All Access + Hospitality',
      price: 800,
      badge: 'Biker Pack VIP',
    },
  ];

  const currentTier = tiersList.find((t: any) => t.id === selectedTierId) || tiersList[0];
  const tierPrice = Number(currentTier?.price) || 150;
  const totalAmount = tierPrice * quantity;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || customerName.trim().length < 2) {
      setError('Por favor ingresa tu nombre completo');
      return;
    }

    const cleanDigits = customerPhone.replace(/[^\d]/g, '');
    if (cleanDigits.length < 10) {
      setError('Por favor ingresa un número de WhatsApp válido (mínimo 10 dígitos)');
      return;
    }

    setLoading(true);

    try {
      const fullPhone = `${countryCode}${cleanDigits}`;
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: eventData?.id || 'evt_rodada_terror_2026',
          customerName: customerName.trim(),
          customerPhone: fullPhone,
          tierId: selectedTierId,
          quantity,
          rpCode: rpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al apartar boletos');
      }

      setActiveTicketIndex(0);
      setSuccessData(data);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
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
          <div className="relative z-20 -mt-8 sm:-mt-12 w-[90%] max-w-[500px] hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_30px_rgba(220,38,38,0.5)]">
            <Image 
              src="/images/domingo-sangriento-1-nov-2026.png" 
              alt="Domingo Sangriento - 1 Nov 2026" 
              width={1448}
              height={1086}
              priority
              style={{ width: '100%', height: 'auto' }}
              className="object-contain"
            />
          </div>
        </div>

        {/* HIGH-IMPACT LINEUP OFICIAL REVELADO */}
        <div className="w-full text-center mb-16 sm:mb-24 relative z-20">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-red-600"></div>
            <h3 className="text-[10px] sm:text-xs font-mono font-black text-red-500 tracking-[0.3em] uppercase">
              Lineup Oficial • Confirmado
            </h3>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-red-600"></div>
          </div>

          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border border-red-900/40 bg-black/60 backdrop-blur-md shadow-[0_0_50px_rgba(220,38,38,0.15)]">
            {/* Ambient Red Glow in Card */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-80" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-32 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Lineup Content */}
            <div className="relative z-10 flex flex-col items-center gap-6">
              {/* Headliners */}
              <div className="flex flex-col items-center gap-0">
                <div className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter drop-shadow-[0_0_35px_rgba(239,68,68,0.4)] horror-glitch-text">
                  Vale Queen
                </div>
                <div className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-400 uppercase tracking-tighter mt-[-2%] drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                  DJ Jhonaz
                </div>
              </div>

              {/* Sub-headliners / Urban Acts */}
              <div className="w-full max-w-xl mt-4 flex flex-col items-center">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest mb-3 border border-red-900/60 px-3.5 py-1 rounded-full bg-red-950/40">
                  Show Urbano & Trap
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-200 uppercase tracking-tight flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
                  <span className="hover:text-red-400 transition-colors">DG</span>
                  <span className="text-red-900 text-sm">/</span>
                  <span className="hover:text-red-400 transition-colors">Pasatiempo</span>
                  <span className="text-red-900 text-sm">/</span>
                  <span className="hover:text-red-400 transition-colors">El Bala</span>
                  <span className="text-red-900 text-sm">/</span>
                  <span className="hover:text-red-400 transition-colors text-red-500">Ahuja</span>
                </div>
              </div>

              {/* DJs & Performance */}
              <div className="w-full max-w-xl mt-2 flex flex-col items-center">
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest mb-3 border border-red-900/60 px-3.5 py-1 rounded-full bg-red-950/40">
                  Club, DJs & Performance
                </span>
                <div className="text-xl sm:text-2xl font-black text-slate-200 uppercase tracking-tight flex flex-wrap justify-center items-center gap-x-4 gap-y-1">
                  <span className="hover:text-red-400 transition-colors">DJ Fragot</span>
                  <span className="text-red-900 text-sm">/</span>
                  <span className="hover:text-red-400 transition-colors text-yellow-500 font-mono">DJ Koy</span>
                  <span className="text-red-900 text-sm">/</span>
                  <span className="hover:text-red-400 transition-colors text-yellow-500 font-mono">DJ Gato</span>
                  <span className="text-red-900 text-sm">/</span>
                  <span className="flex items-center gap-2">
                    Los Babys
                    <span className="text-[10px] sm:text-xs text-red-400 tracking-widest font-mono border border-red-500/40 bg-red-950/50 px-2 py-0.5 rounded-sm">Gogos Show</span>
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
            <span>{eventData?.event_date || '1 Nov 2026'}</span>
          </div>
          <div className="hidden sm:block text-red-900/50">|</div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-600" />
            <span>{eventData?.event_time ? `${eventData.event_time} HRS` : '21:00 HRS'}</span>
          </div>
          <div className="hidden sm:block text-red-900/50">|</div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-600" />
            <span>{eventData?.location || 'Salón del Sindicato del IMSS'}</span>
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

            {/* Tier Selector Carousel/Grid */}
            <div className="space-y-2 mb-6">
              <span className="text-[10px] uppercase text-slate-400 font-mono tracking-widest block mb-2">
                Selecciona tu Acceso:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {tiersList.map((tier: any) => {
                  const isSelected = tier.id === selectedTierId;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTierId(tier.id)}
                      className={`text-left p-3 rounded-xl border transition-all duration-300 relative overflow-hidden ${
                        isSelected
                          ? 'bg-red-950/70 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]'
                          : 'bg-black/50 border-slate-800/70 hover:border-slate-600 text-slate-400'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1 mb-1">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${isSelected ? 'text-red-400' : 'text-slate-500'}`}>
                          {tier.badge || 'Acceso'}
                        </span>
                        <span className="text-yellow-400 font-mono font-black text-xs">
                          ${tier.price} <span className="text-[8px]">MXN</span>
                        </span>
                      </div>
                      <div className={`font-black text-xs tracking-tight line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                        {tier.name}
                      </div>
                    </button>
                  );
                })}
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
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in">
          <div className="w-full max-w-md relative z-10 bg-[#0a0a0f]/95 border border-red-900/60 rounded-3xl p-4 sm:p-6 shadow-[0_0_50px_rgba(220,38,38,0.25)] max-h-[94vh] overflow-y-auto flex flex-col items-center">
            
            {/* Top Close Button */}
            <button
              type="button"
              onClick={() => setSuccessData(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 border border-slate-700/60 text-slate-400 hover:text-white hover:border-red-500 transition-colors z-20"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Status Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>¡Pre-registro Exitoso! • Folio {successData.orderId}</span>
            </div>

            {/* Ticket Display Card */}
            {successData.tickets && successData.tickets.length > 0 && (
              <div className="w-full mb-3 flex flex-col items-center">
                {/* Single / Active Ticket View */}
                {(() => {
                  const safeIndex = Math.min(activeTicketIndex, successData.tickets.length - 1);
                  const activeTicket = successData.tickets[safeIndex] || successData.tickets[0];
                  return (
                    <div className="w-full flex flex-col items-center">
                      <div className="relative w-full flex items-center justify-center mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeTicket.image}
                          alt={`Boleto ${activeTicket.code}`}
                          className="w-full max-h-[46vh] object-contain rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.35)] border border-red-800/40"
                        />
                      </div>

                      {/* Ticket navigation if multiple tickets */}
                      {successData.tickets.length > 1 && (
                        <div className="flex items-center justify-between w-full px-2 py-1 mb-2 bg-slate-900/50 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
                          <button
                            type="button"
                            onClick={() => setActiveTicketIndex((prev) => Math.max(0, prev - 1))}
                            disabled={safeIndex === 0}
                            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span>Boleto {safeIndex + 1} de {successData.tickets.length} ({activeTicket.code})</span>
                          <button
                            type="button"
                            onClick={() => setActiveTicketIndex((prev) => Math.min(successData.tickets.length - 1, prev + 1))}
                            disabled={safeIndex === successData.tickets.length - 1}
                            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Action buttons for active ticket */}
                      <div className="flex gap-2 w-full mb-3">
                        <a
                          href={activeTicket.image}
                          target="_blank"
                          rel="noreferrer"
                          download={`Boleto-${activeTicket.code}.png`}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-red-400" />
                          <span>Descargar PNG</span>
                        </a>
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `Mi boleto para Horror Fest 2026 (${activeTicket.code}): ${typeof window !== 'undefined' ? window.location.origin : ''}${activeTicket.image}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Compartir</span>
                        </a>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Cash Payment Instructions */}
            <div className="w-full bg-black/80 rounded-2xl p-4 border border-emerald-500/30 text-left mb-3 font-mono text-xs space-y-2">
              <div className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Modalidad de Cobro: Únicamente Efectivo</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Tus accesos están apartados. Presenta este código QR o tu folio en taquilla / puerta para pagar en efectivo y recibir tu pulsera oficial.
              </p>
              <div className="flex justify-between items-center text-slate-400 pt-1.5 border-t border-slate-800">
                <span>Lugar de Pago:</span>
                <span className="text-white font-bold">{eventData?.location || 'Salón del Sindicato del IMSS'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Folio de Reserva:</span>
                <span className="text-red-400 font-bold">{successData.orderId}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400 pt-1.5 border-t border-slate-800">
                <span>Total a Pagar en Efectivo:</span>
                <span className="text-emerald-400 font-black text-sm">${successData.totalAmount} MXN</span>
              </div>
            </div>

            {/* WhatsApp notification CTA */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `¡Hola! Ya realicé mi pre-registro para Horror Fest 2026.\n` +
                `📋 Folio: ${successData.orderId}\n` +
                `👤 Nombre: ${customerName}\n` +
                `🎟️ Cantidad: ${quantity} boletos\n` +
                `💰 Total a pagar en efectivo: $${successData.totalAmount} MXN\n` +
                `Pagaré directamente en taquilla / con mi RP al llegar.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 px-4 mb-2 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)] transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar Comprobante por WhatsApp</span>
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSuccessData(null)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Cerrar y Volver a la Landing
            </button>
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
