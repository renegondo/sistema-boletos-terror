import React from 'react';

export default function CartelExportPage() {
  return (
    <div className="w-[1080px] h-[1920px] bg-[#08080b] text-white relative overflow-hidden flex flex-col justify-between p-12 select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        #next-logo, #nextjs-dev-tools, [data-nextjs-toast], [data-next-badge], nextjs-portal {
          display: none !important;
        }
      `}} />

      {/* Background radial glows and textures */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Spray paint background effects */}
        <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-white/[0.03] to-transparent" />
        <div className="absolute top-20 left-12 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-[480px] right-12 w-96 h-96 bg-blue-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-[800px] left-16 w-96 h-96 bg-orange-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-40 right-16 w-[450px] h-[450px] bg-red-600/15 rounded-full blur-[120px]" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:28px_28px]" />

        {/* Airbrush drips and spray splashes */}
        <div className="absolute top-10 left-8 w-44 h-44 rounded-full border-2 border-dashed border-white/10 blur-[1px] opacity-40" />
        <div className="absolute top-24 right-10 w-36 h-36 rounded-full border-2 border-dashed border-white/10 blur-[1px] opacity-40" />
      </div>

      {/* Vertical Edge Editorial Labels */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[10px] font-mono tracking-[0.4em] text-white/40 uppercase whitespace-nowrap">
        SALÓN DEL SINDICATO DEL IMSS • DESCORCHE LIBRE (BYOB) • ACCESO 21:00 HRS
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 origin-center text-[10px] font-mono tracking-[0.4em] text-white/40 uppercase whitespace-nowrap">
        AFTER DE LA RODADA DEL TERROR 2026 • FLOW PRODUCTIONS • PREVENTA OFICIAL
      </div>

      {/* ======================================================== */}
      {/* HEADER */}
      {/* ======================================================== */}
      <div className="relative z-10 flex flex-col items-center pt-2">
        {/* 2026 Pill Badge */}
        <div className="inline-flex items-center px-6 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-md mb-2 shadow-lg">
          <span className="text-sm font-mono font-black tracking-widest text-white">2026</span>
        </div>

        {/* Liquid Glass "line-up" typography */}
        <div className="relative flex items-center justify-center my-1 px-8 py-2">
          {/* Frosted lens capsule */}
          <div className="absolute inset-x-0 inset-y-0 rounded-[44px] bg-white/[0.04] backdrop-blur-[4px] border border-white/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_10px_30px_rgba(0,0,0,0.5)] pointer-events-none" />

          <h1
            className="text-[124px] font-black tracking-tighter lowercase leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_8px_30px_rgba(255,255,255,0.35)] relative z-10"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              letterSpacing: '-0.06em',
            }}
          >
            line-up
          </h1>
        </div>

        <p className="text-xs font-mono tracking-[0.45em] uppercase text-red-500 font-black mt-2">
          ★ AFTER OFICIAL RODADA DEL TERROR ★
        </p>
      </div>

      {/* ======================================================== */}
      {/* POSTER BODY - BENTO CARDS */}
      {/* ======================================================== */}
      <div className="relative z-10 flex flex-col gap-4 my-auto px-8">

        {/* ---------------------------------------------------- */}
        {/* ROW 1: VALE QUEEN (Hero Headliner - Text Left, Cutout Right) */}
        {/* ---------------------------------------------------- */}
        <div className="relative">
          {/* Cutout Photo */}
          <div className="absolute -top-24 right-6 w-64 h-80 z-20 pointer-events-none">
            <img
              src="/lineup/valequeen.png"
              alt="Vale Queen"
              className="w-full h-full object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)] filter contrast-105"
            />
          </div>

          <div className="relative overflow-hidden rounded-[38px] bg-gradient-to-r from-[#d90479] via-[#ec4899] to-[#be185d] p-8 h-[165px] flex flex-col justify-between shadow-[0_15px_40px_rgba(225,29,72,0.4)] border border-white/25">
            <div className="absolute top-0 right-1/4 w-48 h-48 bg-white/25 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-[62%]">
              <span className="text-xs font-mono font-black uppercase tracking-widest text-pink-200 flex items-center gap-1.5 mb-1">
                <span>★</span> HEADLINER ESTELAR
              </span>
              <h2 className="text-6xl font-black uppercase tracking-tighter text-white leading-none drop-shadow-lg">
                VALE QUEEN
              </h2>
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <span className="text-sm font-mono font-bold text-white tracking-wider bg-black/25 px-3 py-1 rounded-lg border border-white/10">
                01 NOV / DOMINGO
              </span>
              <span className="text-xs font-mono font-bold text-pink-100 tracking-widest uppercase">
                @VALEQUEENOFICIAL • LIVE SHOW
              </span>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* ROW 2: DJ JHONAZ (Headliner DJ - Cutout Left, Text Right) */}
        {/* ---------------------------------------------------- */}
        <div className="relative mt-2">
          {/* Cutout Photo placed on LEFT with feet nicely anchored */}
          <div className="absolute -top-16 left-6 w-56 h-68 z-20 pointer-events-none">
            <img
              src="/lineup/jhonaz.png"
              alt="DJ Jhonaz"
              className="w-full h-full object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.95)] filter contrast-110"
            />
          </div>

          <div className="relative overflow-hidden rounded-[38px] bg-gradient-to-r from-[#0284c7] via-[#2563eb] to-[#1d4ed8] p-8 h-[165px] flex flex-col justify-between items-end shadow-[0_15px_40px_rgba(37,99,235,0.4)] border border-white/25">
            <div className="absolute top-0 left-1/4 w-48 h-48 bg-cyan-300/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-right max-w-[65%]">
              <span className="text-xs font-mono font-black uppercase tracking-widest text-cyan-200 flex items-center justify-end gap-1.5 mb-1">
                <span>⚡</span> DJ ESTELAR OFICIAL
              </span>
              <h2 className="text-6xl font-black uppercase tracking-tighter text-white leading-none drop-shadow-lg">
                DJ JHONAZ
              </h2>
            </div>

            <div className="relative z-10 flex items-center gap-4">
              <span className="text-xs font-mono font-bold text-cyan-100 tracking-widest uppercase">
                PERREO & TECH FLOW • EXCLUSIVE SET
              </span>
              <span className="text-sm font-mono font-bold text-white tracking-wider bg-black/25 px-3 py-1 rounded-lg border border-white/10">
                01 NOV / DOMINGO
              </span>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* ROW 3: SHOW URBANO (DG & PASATIEMPO) */}
        {/* ---------------------------------------------------- */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* DG */}
          <div className="relative">
            <div className="absolute -top-16 right-2 w-44 h-56 z-20 pointer-events-none">
              <img
                src="/lineup/dg.png"
                alt="DG"
                className="w-full h-full object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] filter contrast-105"
              />
            </div>

            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#ea580c] via-[#f97316] to-[#c2410c] p-6 h-[155px] flex flex-col justify-between shadow-[0_12px_35px_rgba(234,88,12,0.35)] border border-white/25">
              <div className="relative z-10">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-amber-200 block">
                  SHOW URBANO & TRAP
                </span>
                <h3 className="text-5xl font-black uppercase tracking-tight text-white leading-none mt-1">
                  DG
                </h3>
              </div>
              <div className="relative z-10 text-xs font-mono font-bold text-amber-100 tracking-widest uppercase">
                LIVE STAGE • 01 NOV
              </div>
            </div>
          </div>

          {/* PASATIEMPO - Enlarged Torso Crop */}
          <div className="relative">
            <div className="absolute -top-14 -right-1 w-48 h-60 z-20 pointer-events-none overflow-hidden">
              <img
                src="/lineup/pasatiempo.png"
                alt="Pasatiempo"
                className="w-full h-full object-cover object-top scale-125 translate-y-3 drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] filter contrast-105"
              />
            </div>

            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#7c3aed] via-[#9333ea] to-[#6d28d9] p-6 h-[155px] flex flex-col justify-between shadow-[0_12px_35px_rgba(124,58,237,0.35)] border border-white/25">
              <div className="relative z-10">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-purple-200 block">
                  FLOW & TRAP
                </span>
                <h3 className="text-4xl font-black uppercase tracking-tight text-white leading-none mt-1">
                  PASATIEMPO
                </h3>
              </div>
              <div className="relative z-10 text-xs font-mono font-bold text-purple-100 tracking-widest uppercase">
                LIVE STAGE • 01 NOV
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* ROW 4: SHOW URBANO (AHUJA & EL BALA) */}
        {/* ---------------------------------------------------- */}
        <div className="grid grid-cols-2 gap-4 mt-2">
          {/* AHUJA */}
          <div className="relative">
            <div className="absolute -top-14 right-2 w-44 h-56 z-20 pointer-events-none">
              <img
                src="/lineup/ahuja.png"
                alt="Ahuja"
                className="w-full h-full object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] filter contrast-105"
              />
            </div>

            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#dc2626] via-[#b91c1c] to-[#991b1b] p-6 h-[155px] flex flex-col justify-between shadow-[0_12px_35px_rgba(220,38,38,0.35)] border border-white/25">
              <div className="relative z-10">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-red-200 block">
                  URBAN FLOW
                </span>
                <h3 className="text-4xl font-black uppercase tracking-tight text-white leading-none mt-1">
                  AHUJA
                </h3>
              </div>
              <div className="relative z-10 text-xs font-mono font-bold text-red-200 tracking-widest uppercase">
                LIVE ACT • 01 NOV
              </div>
            </div>
          </div>

          {/* EL BALA (Stylized Street Typography + Chrome Skull) */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#facc15] via-[#eab308] to-[#ca8a04] p-6 h-[155px] flex flex-col justify-between shadow-[0_12px_35px_rgba(250,204,21,0.35)] border border-white/25">
              {/* Chrome Skull Accent */}
              <div className="absolute top-4 right-5 text-5xl filter drop-shadow-md select-none pointer-events-none opacity-90">
                💀
              </div>

              <div className="relative z-10">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-900 block">
                  FREESTYLE & TRAP
                </span>
                <h3 className="text-5xl font-black uppercase tracking-tight text-slate-950 leading-none mt-1">
                  EL BALA
                </h3>
              </div>
              <div className="relative z-10 text-xs font-mono font-bold text-slate-950 tracking-widest uppercase">
                SPECIAL GUEST • 01 NOV
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* ROW 5: CLUB DJS (Split 3 Columns) */}
        {/* ---------------------------------------------------- */}
        <div className="grid grid-cols-3 gap-3.5 mt-2">
          {/* DJ FRAGOT */}
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#0284c7] via-[#0369a1] to-[#075985] p-4 text-center border border-white/20 shadow-lg">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-cyan-200 block">
              CLUB DJ
            </span>
            <h4 className="text-xl font-black uppercase tracking-tight text-white mt-1">
              DJ FRAGOT
            </h4>
            <span className="text-[10px] font-mono text-cyan-100 tracking-wider block mt-1">
              TECH & BEATS
            </span>
          </div>

          {/* DJ KOY */}
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#059669] via-[#047857] to-[#065f46] p-4 text-center border border-white/20 shadow-lg">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-200 block">
              CLUB DJ
            </span>
            <h4 className="text-xl font-black uppercase tracking-tight text-white mt-1">
              DJ KOY
            </h4>
            <span className="text-[10px] font-mono text-emerald-100 tracking-wider block mt-1">
              PERREO INTENSO
            </span>
          </div>

          {/* DJ GATO */}
          <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#d97706] via-[#b45309] to-[#92400e] p-4 text-center border border-white/20 shadow-lg">
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-200 block">
              CLUB DJ
            </span>
            <h4 className="text-xl font-black uppercase tracking-tight text-white mt-1">
              DJ GATO
            </h4>
            <span className="text-[10px] font-mono text-amber-100 tracking-wider block mt-1">
              REGGAETON FLOW
            </span>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* ROW 6: PERFORMANCE GOGO SHOW (Full Width) */}
        {/* ---------------------------------------------------- */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#881337] via-[#4c0519] to-[#881337] p-5 border border-red-500/40 shadow-[0_10px_30px_rgba(136,19,55,0.45)] flex items-center justify-between mt-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center text-2xl shadow-inner">
              💋
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-red-400">
                PERFORMANCE & DANCE SHOW
              </span>
              <h4 className="text-2xl font-black uppercase tracking-tight text-white leading-none mt-0.5">
                LOS BABYS <span className="text-sm font-mono font-bold text-red-400 ml-2 border border-red-500/40 px-3 py-0.5 rounded-full bg-red-950/70">GOGOS SHOW</span>
              </h4>
            </div>
          </div>
          <div className="text-xs font-mono font-bold text-red-300 tracking-widest uppercase text-right">
            SHOW EXCLUSIVO DE TERROR
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* POSTER FOOTER */}
      {/* ======================================================== */}
      <div className="relative z-10 pt-4 pb-2 border-t border-white/15 flex items-center justify-between px-8">
        <div className="flex flex-col">
          <span className="text-sm font-mono font-black text-white tracking-wider uppercase">
            TICKETS: SISTEMA BOLETOS // WHATSAPP OFICIAL
          </span>
          <span className="text-xs font-mono text-white/60 tracking-widest uppercase">
            SALÓN DEL SINDICATO DEL IMSS • DESCORCHE LIBRE (BYOB) • ACCESO 21:00 HRS
          </span>
        </div>

        {/* Parental Advisory Badge */}
        <div className="border-2 border-white bg-black px-4 py-1 text-center leading-none select-none shadow-md">
          <div className="text-[8px] font-mono tracking-widest uppercase text-white/80">PARENTAL</div>
          <div className="text-sm font-black tracking-tight text-white">ADVISORY</div>
          <div className="text-[8px] font-mono tracking-widest uppercase text-white/80">EXPLICIT PARTY</div>
        </div>
      </div>
    </div>
  );
}
