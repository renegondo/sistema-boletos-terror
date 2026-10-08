'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  CameraOff, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Search, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  User, 
  Ticket, 
  Calendar, 
  Clock, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  SwitchCamera
} from 'lucide-react';
import { User as UserType } from '@/types';

// Audio Beep generator using Web Audio API
function playSound(type: 'success' | 'error' | 'warning') {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.setValueAtTime(164.81, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } else {
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }
  } catch {
    // Audio might be blocked before user interaction
  }
}

export default function ScannerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // Camera & Scanner State
  const [cameraActive, setCameraActive] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string>('');
  
  // Validation state
  const [manualCode, setManualCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const html5QrCodeRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user) {
          router.push('/login');
          return;
        }
        setCurrentUser(data.user);
      });

    // Cleanup scanner on unmount
    return () => {
      stopCamera();
    };
  }, [router]);

  const extractTicketCode = (rawText: string): string => {
    const text = rawText.trim();
    // Case 1: JSON payload
    try {
      const parsed = JSON.parse(text);
      if (parsed.c) return parsed.c;
      if (parsed.code) return parsed.code;
    } catch {
      // Not JSON
    }

    // Case 2: Regex match for TKT-XXXXXX
    const match = text.match(/TKT-[A-Z0-9]+/i);
    if (match) return match[0].toUpperCase();

    return text.toUpperCase();
  };

  const validateCode = async (rawCode: string) => {
    const cleanCode = extractTicketCode(rawCode);
    if (!cleanCode) return;

    setIsValidating(true);
    setScanResult(null);

    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(cleanCode)}/check-in`, {
        method: 'POST',
      });
      const data = await res.json();
      setScanResult(data);

      if (data.valid) {
        if (soundEnabled) playSound('success');
      } else if (data.status === 'used') {
        if (soundEnabled) playSound('error');
      } else {
        if (soundEnabled) playSound('warning');
      }

      // Add to session scan history
      setHistory(prev => [
        {
          code: cleanCode,
          attendee: data.ticket?.attendee_name || 'Desconocido',
          tier: data.ticket?.tier_name || 'General',
          valid: data.valid,
          status: data.status,
          time: new Date().toLocaleTimeString('es-MX'),
        },
        ...prev.slice(0, 19),
      ]);

    } catch (err: any) {
      setScanResult({
        success: false,
        valid: false,
        message: err.message || 'Error de conexión con el servidor',
      });
      if (soundEnabled) playSound('error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCollectPayment = async (orderId: string, ticketCode: string) => {
    try {
      setIsValidating(true);
      const res = await fetch(`/api/orders/${orderId}/complete`, { method: 'POST' });
      if (res.ok) {
        // Re-validate to mark as used and show success
        await validateCode(ticketCode);
      } else {
        const data = await res.json();
        setScanResult((prev: any) => prev ? {
          ...prev,
          message: data.error || 'Error al procesar el pago',
        } : null);
        setIsValidating(false);
      }
    } catch (err) {
      setScanResult((prev: any) => prev ? {
        ...prev,
        message: 'Error de conexión al intentar cobrar',
      } : null);
      setIsValidating(false);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-camera-viewport');
      }

      // Query available camera devices
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('No se detectó ninguna cámara en este dispositivo.');
      }

      setCameras(devices.map(d => ({ id: d.id, label: d.label || `Cámara ${d.id.slice(0, 5)}` })));
      const chosenCam = selectedCameraId || devices[devices.length - 1].id; // Back camera is usually last on mobile
      setSelectedCameraId(chosenCam);

      await html5QrCodeRef.current.start(
        chosenCam,
        {
          fps: 12,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          // Prevent multiple scans while processing
          if (isScanningRef.current) return;
          isScanningRef.current = true;

          validateCode(decodedText);

          // Cooldown before scanning another
          setTimeout(() => {
            isScanningRef.current = false;
          }, 2500);
        },
        () => {
          // Ignored per-frame no-QR detection
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError(err.message || 'Permiso de cámara denegado o no disponible.');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error('Error stopping camera:', err);
      }
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    validateCode(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            Lector de Boletos con Cámara QR
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Escanea entradas con la cámara de tu celular o computadora para validar el acceso al evento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title="Activar/Desactivar sonido"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Sonido Activado' : 'Silencio'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Viewport & Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Visor de Cámara en Vivo
                </span>
                {cameraActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </div>

              {cameraActive && cameras.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <SwitchCamera className="w-3.5 h-3.5" />
                  <select
                    value={selectedCameraId}
                    onChange={async (e) => {
                      const newId = e.target.value;
                      setSelectedCameraId(newId);
                      await stopCamera();
                      setTimeout(startCamera, 300);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none"
                  >
                    {cameras.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Video Viewport Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-h-[380px] flex items-center justify-center border border-slate-200">
              <div id="qr-camera-viewport" className="w-full h-full" />

              {!cameraActive && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 z-10">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1 border border-indigo-500/30">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-white">Cámara Desactivada</h3>
                  <p className="text-xs text-slate-300 max-w-xs">
                    Haz clic en el botón inferior para solicitar permiso y activar la cámara para escanear boletos.
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Activar Cámara Ahora</span>
                  </button>
                </div>
              )}

              {/* Viewfinder Overlay when Camera is Active */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                  <div className="relative w-64 h-64 border-2 border-indigo-400/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    {/* Laser line */}
                    <div className="scanner-laser" />
                    {/* Corner guides */}
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-white rounded-br" />
                  </div>
                </div>
              )}
            </div>

            {/* Camera Error Message */}
            {cameraError && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Toggle Button */}
            {cameraActive && (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center justify-center gap-2 transition-all"
                >
                  <CameraOff className="w-4 h-4 text-slate-500" />
                  <span>Detener Cámara</span>
                </button>
              </div>
            )}
          </div>

          {/* Manual Entry Fallback */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Validación Manual o Pistola de Código de Barras
            </h3>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="Ej: TKT-4651B97F"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-wider"
                />
              </div>
              <button
                type="submit"
                disabled={isValidating || !manualCode.trim()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40"
              >
                Validar
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Scan Result & Real-time Feedback */}
        <div className="lg:col-span-5 space-y-5">
          {/* Result Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[320px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Resultado del Acceso
                </span>
                {isValidating && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </div>
                )}
              </div>

              {!scanResult ? (
                <div className="py-14 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Esperando escaneo...</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Apunta la cámara al código QR del boleto del asistente o ingresa el folio manualmente.
                  </p>
                </div>
              ) : scanResult.valid ? (
                /* 🟢 VALID TICKET */
                <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-emerald-900 leading-tight">¡ACCESO AUTORIZADO!</h3>
                      <p className="text-xs text-emerald-700 font-semibold">Boleto válido y verificado con éxito.</p>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3.5 border border-emerald-200 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px] font-semibold">TITULAR DEL BOLETO:</span>
                      <strong className="text-slate-900 text-base block font-bold">
                        {scanResult.ticket?.attendee_name}
                      </strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-100">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold">ZONA / TIPO:</span>
                        <span className="font-extrabold text-emerald-700 text-sm">
                          {scanResult.ticket?.tier_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-semibold">FOLIO:</span>
                        <span className="font-mono font-bold text-slate-800 text-xs">
                          {scanResult.ticket?.ticket_code}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-100 text-[11px] text-slate-600">
                      <span>Evento: <strong>{scanResult.ticket?.event_title}</strong></span>
                    </div>
                  </div>
                </div>
              ) : scanResult.status === 'used' ? (
                /* 🔴 USED TICKET FRAUD ALERT */
                <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-500 text-red-950 space-y-3 animate-in shake">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-600/30 animate-pulse">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-red-900 leading-tight">¡ALERTA! BOLETO YA USADO</h3>
                      <p className="text-xs text-red-700 font-medium">Este boleto ya fue ingresado con anterioridad.</p>
                    </div>
                  </div>

                  <div className="bg-white/80 rounded-xl p-3.5 border border-red-200 text-xs space-y-1.5 text-slate-700">
                    <p className="text-red-700 font-bold">{scanResult.message}</p>
                    {scanResult.ticket && (
                      <p className="text-[11px] text-slate-500">
                        Titular registrado: <strong>{scanResult.ticket.attendee_name}</strong> ({scanResult.ticket.tier_name})
                      </p>
                    )}
                  </div>
                </div>
              ) : scanResult.status === 'pending_payment' ? (
                /* 🟡 PENDING PAYMENT ALERT */
                <div className="p-5 rounded-2xl bg-yellow-50 border-2 border-yellow-500 text-yellow-950 space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-yellow-500/30">
                      <AlertTriangle className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-yellow-900 leading-tight">PENDIENTE DE PAGO</h3>
                      <p className="text-xs text-yellow-800 font-bold whitespace-pre-wrap">{scanResult.message}</p>
                    </div>
                  </div>

                  <div className="bg-white/80 rounded-xl p-3.5 border border-yellow-200 text-xs space-y-1.5 text-slate-700">
                    {scanResult.ticket && (
                      <p className="text-[11px] text-slate-500">
                        Titular: <strong>{scanResult.ticket.attendee_name}</strong> ({scanResult.ticket.tier_name})
                      </p>
                    )}
                  </div>

                  {scanResult.orderId && scanResult.ticket && (
                    <button
                      type="button"
                      disabled={isValidating}
                      onClick={() => handleCollectPayment(scanResult.orderId, scanResult.ticket.ticket_code)}
                      className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-widest shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Marcar Pagado y Validar
                    </button>
                  )}
                </div>
              ) : (
                /* 🔴 INVALID / NOT FOUND */
                <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-500 text-amber-950 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                      <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-amber-900">Boleto No Encontrado</h3>
                      <p className="text-xs text-amber-700">Folio inexistente o cancelado en el sistema.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {scanResult && (
              <button
                type="button"
                onClick={() => setScanResult(null)}
                className="w-full mt-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Limpiar Pantalla para Siguiente Boleto
              </button>
            )}
          </div>

          {/* Scanned History List */}
          {history.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Accesos de Esta Sesión ({history.length}):
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl border flex items-center justify-between text-xs bg-slate-50 border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${h.valid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div>
                        <strong className="text-slate-800 block">{h.attendee}</strong>
                        <span className="font-mono text-[10px] text-slate-400">{h.code} • {h.tier}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-slate-400">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
