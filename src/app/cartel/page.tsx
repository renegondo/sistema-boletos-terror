'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, ArrowLeft, Sparkles, Check, ExternalLink } from 'lucide-react';

export default function CartelLineupPage() {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    const link = document.createElement('a');
    link.href = '/cartel-lineup-hd.png';
    link.download = 'Cartel-Oficial-Lineup-Terror-2026.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col items-center py-6 px-3 sm:px-6 relative selection:bg-red-600 selection:text-white">
      {/* Top Floating Controls Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-3 mb-6 z-50 bg-[#121218]/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10 shadow-2xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4 text-red-500" />
          <span className="hidden sm:inline">Volver a la</span> Landing
        </Link>

        <div className="flex items-center gap-2 text-center">
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-950/80 text-red-400 border border-red-500/30">
            <Sparkles className="w-3 h-3 text-red-400 animate-pulse" />
            Cartel Oficial Line-Up 2026
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/cartel/export"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white px-2.5 py-2 rounded-lg hover:bg-white/5"
            title="Abrir en pantalla completa 1080x1920"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Full Screen
          </a>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white px-4 sm:px-5 py-2 rounded-xl shadow-[0_0_25px_rgba(225,29,72,0.4)] hover:shadow-[0_0_35px_rgba(225,29,72,0.6)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>¡Descargado!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 animate-bounce" />
                <span>{downloading ? 'Descargando...' : 'Descargar PNG HD'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* POSTER DISPLAY CONTAINER */}
      <div className="w-full max-w-[560px] rounded-[36px] overflow-hidden shadow-[0_20px_80px_rgba(0,0,0,0.95)] border border-white/10">
        <img
          src="/cartel-lineup-hd.png"
          alt="Cartel Oficial Line-Up After de la Rodada del Terror 2026"
          className="w-full h-auto block select-none"
        />
      </div>

      {/* Helper text under poster */}
      <div className="mt-5 text-center text-xs font-mono text-slate-400 flex flex-col items-center gap-1">
        <span className="text-slate-300 font-bold">✨ Archivo de Alta Resolución (1080 × 1920 px)</span>
        <span className="text-[11px] text-slate-500">Listo para descargar y compartir directamente en WhatsApp, Instagram Stories y redes sociales.</span>
      </div>
    </div>
  );
}
