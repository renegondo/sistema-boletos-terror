'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  Send, 
  Key, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { User } from '@/types';

export default function ConfiguracionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Form settings
  const [apiUrl, setApiUrl] = useState('http://localhost:8080');
  const [apiKey, setApiKey] = useState('');
  const [instanceName, setInstanceName] = useState('boletos_instance');
  const [autoSend, setAutoSend] = useState(true);
  const [businessName, setBusinessName] = useState('Hi-Boletos Express');

  // Test connection state
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; state?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(userData => {
        if (!userData?.user || userData.user.role !== 'admin') {
          router.push('/');
          return;
        }
        setUser(userData.user);

        return fetch('/api/settings');
      })
      .then(res => res?.ok ? res.json() : null)
      .then(data => {
        if (data?.settings) {
          if (data.settings.evolution_api_url) setApiUrl(data.settings.evolution_api_url);
          if (data.settings.evolution_api_key) setApiKey(data.settings.evolution_api_key);
          if (data.settings.evolution_instance_name) setInstanceName(data.settings.evolution_instance_name);
          if (data.settings.whatsapp_auto_send) setAutoSend(data.settings.whatsapp_auto_send === '1');
          if (data.settings.business_name) setBusinessName(data.settings.business_name);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evolution_api_url: apiUrl.trim(),
          evolution_api_key: apiKey.trim(),
          evolution_instance_name: instanceName.trim(),
          whatsapp_auto_send: autoSend ? '1' : '0',
          business_name: businessName.trim(),
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evolution_api_url: apiUrl.trim(),
        evolution_api_key: apiKey.trim(),
        evolution_instance_name: instanceName.trim(),
      }),
    });

    try {
      const res = await fetch('/api/settings/test-evolution', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error de conexión con el servidor',
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          Configuración de Evolution API & WhatsApp
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          Vincula tu instancia de Evolution API para enviar boletos digitales con QR directamente al WhatsApp de los clientes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Configuración guardada exitosamente.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                URL del Servidor Evolution API *
              </label>
              <input
                type="url"
                required
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                placeholder="http://localhost:8080 o https://api.tudominio.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                La URL base donde corre tu contenedor de Evolution API.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                Global API Key de Evolution API *
              </label>
              <input
                type="password"
                required
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AUTHENTICATION_API_KEY"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Definida en tu archivo .env o cabecera apikey de Evolution API.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                Nombre de la Instancia de WhatsApp *
              </label>
              <input
                type="text"
                required
                value={instanceName}
                onChange={e => setInstanceName(e.target.value)}
                placeholder="boletos_instance"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nombre de la sesión conectada al número emisor en WhatsApp.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSend}
                  onChange={e => setAutoSend(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div>
                  <span className="text-sm font-bold text-slate-900 block">
                    Envío automático de boletos al cobrar
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Envía la imagen con el QR y los datos del evento al instante por WhatsApp al confirmar la venta en taquilla.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="submit"
                disabled={saving}
                className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Test Connection Card & Info */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              Diagnóstico de Conexión
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Verifica si el sistema puede comunicarse con Evolution API y si el WhatsApp está enlazado.
            </p>

            <button
              type="button"
              disabled={testLoading}
              onClick={handleTestConnection}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 transition-all"
            >
              {testLoading ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Probar Conexión Ahora</span>
                </>
              )}
            </button>

            {testResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>{testResult.success ? 'Conexión Exitosa' : 'Fallo de Conexión'}</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed font-medium">
                  {testResult.message}
                </p>
              </div>
            )}
          </div>

          {/* Quick guide box */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-3">
            <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              ¿Cómo funciona el envío?
            </span>
            <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside font-medium">
              <li>El vendedor ingresa el número de WhatsApp del cliente en el POS.</li>
              <li>El sistema genera la tarjeta de acceso digital PNG con código QR visible.</li>
              <li>Evolution API despacha la imagen con los detalles del boleto y folio único al chat de WhatsApp.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
