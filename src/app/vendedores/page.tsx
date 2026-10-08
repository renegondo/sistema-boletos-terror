'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  CheckCircle2, 
  CreditCard, 
  Percent, 
  Calendar, 
  Phone, 
  Mail, 
  AlertCircle,
  Plus,
  FileText
} from 'lucide-react';
import { User } from '@/types';

function VendedoresContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedVendorId = searchParams.get('vendorId');

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedVendorForPayout, setSelectedVendorForPayout] = useState<any | null>(null);

  // New vendor form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCommissionType, setNewCommissionType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCommissionRate, setNewCommissionRate] = useState('10');
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Payout form
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  const loadData = async () => {
    try {
      const [meRes, vendorsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/vendors'),
      ]);

      const meData = await meRes.json();
      if (!meData?.user) {
        router.push('/login');
        return;
      }
      setCurrentUser(meData.user);

      const vendorsData = await vendorsRes.json();
      const list = vendorsData.vendors || [];
      setVendors(list);

      if (preselectedVendorId) {
        const found = list.find((v: any) => v.id === preselectedVendorId);
        if (found) {
          setSelectedVendorForPayout(found);
          setPayoutAmount(String(found.pending_payout || ''));
          setShowPayoutModal(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router, preselectedVendorId]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          phone: newPhone,
          commission_type: newCommissionType,
          commission_rate: Number(newCommissionRate),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear vendedor');

      setShowCreateModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewPhone('');
      await loadData();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRegisterPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForPayout) return;
    setPayoutLoading(true);
    setPayoutError('');

    try {
      const res = await fetch('/api/vendors/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: selectedVendorForPayout.id,
          amount: Number(payoutAmount),
          notes: payoutNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al liquidar comisión');

      setShowPayoutModal(false);
      setPayoutAmount('');
      setPayoutNotes('');
      await loadData();
    } catch (err: any) {
      setPayoutError(err.message);
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            {isAdmin ? 'Gestión de Vendedores & Comisiones' : 'Mis Ganancias & Liquidaciones'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            {isAdmin
              ? 'Configura el esquema de comisión (% o fijo) para cada promotor y liquida sus pagos.'
              : 'Revisa el acumulado de tus comisiones ganadas y los pagos liquidados a tu favor.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Vendedor</span>
          </button>
        )}
      </div>

      {/* Vendors Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="pb-3 pl-2">Vendedor / RP</th>
                <th className="pb-3">Contacto</th>
                <th className="pb-3">Tipo de Comisión</th>
                <th className="pb-3 text-center">Boletos Vendidos</th>
                <th className="pb-3 text-right">Recaudación</th>
                <th className="pb-3 text-right">Comisión Total</th>
                <th className="pb-3 text-right">Liquidado</th>
                <th className="pb-3 text-right">Saldo Pendiente</th>
                {isAdmin && <th className="pb-3 text-center">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 pl-2">
                    <span className="font-bold text-slate-900 block">{v.name}</span>
                    <span className="text-xs text-slate-400 font-mono">{v.email}</span>
                  </td>
                  <td className="py-4 text-xs text-slate-500 font-mono">
                    {v.phone || 'Sin registrar'}
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      v.commission_type === 'percentage'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {v.commission_type === 'percentage' ? (
                        <>
                          <Percent className="w-3 h-3" />
                          {v.commission_rate}% por venta
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-3 h-3" />
                          ${v.commission_rate} fija / boleto
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-4 text-center font-bold text-slate-900 font-mono text-base">
                    {v.total_tickets_sold}
                  </td>
                  <td className="py-4 text-right font-mono text-slate-700 font-medium">
                    ${v.total_revenue.toFixed(2)}
                  </td>
                  <td className="py-4 text-right font-mono font-black text-indigo-600 text-base">
                    ${v.total_commissions.toFixed(2)}
                  </td>
                  <td className="py-4 text-right font-mono text-slate-500">
                    ${v.total_paid.toFixed(2)}
                  </td>
                  <td className="py-4 text-right font-mono font-black text-emerald-600 text-base">
                    ${v.pending_payout.toFixed(2)}
                  </td>
                  {isAdmin && (
                    <td className="py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedVendorForPayout(v);
                          setPayoutAmount(String(v.pending_payout > 0 ? v.pending_payout : ''));
                          setShowPayoutModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all"
                      >
                        Pagar Comisión
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE VENDOR MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Alta de Nuevo Vendedor / RP
            </h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">
              El vendedor podrá iniciar sesión con su correo y contraseña para cobrar en físico.
            </p>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateVendor} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Ej: Roberto Gómez"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="roberto@boletos.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Contraseña *</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Teléfono WhatsApp</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Commission Config */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Configuración del Esquema de Comisión
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCommissionType('percentage')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      newCommissionType === 'percentage'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Percent className="w-3.5 h-3.5" />
                    Porcentaje (%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCommissionType('fixed')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      newCommissionType === 'fixed'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Comisión Fija ($)
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">
                    {newCommissionType === 'percentage'
                      ? 'Porcentaje sobre el total de la venta (%)'
                      : 'Monto fijo ganado por cada boleto vendido ($ MXN)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newCommissionRate}
                    onChange={e => setNewCommissionRate(e.target.value)}
                    placeholder={newCommissionType === 'percentage' ? '10' : '50'}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {createLoading ? 'Guardando...' : 'Crear Vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYOUT MODAL */}
      {showPayoutModal && selectedVendorForPayout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Liquidar Comisión
            </h2>
            <p className="text-xs text-slate-500 mb-5 font-medium">
              Registra un pago de comisión a favor de <strong className="text-slate-900">{selectedVendorForPayout.name}</strong>.
            </p>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 mb-4 flex justify-between items-center text-xs">
              <span className="text-emerald-800 font-semibold">Saldo pendiente acumulado:</span>
              <span className="font-mono font-black text-emerald-700 text-base">
                ${selectedVendorForPayout.pending_payout.toFixed(2)} MXN
              </span>
            </div>

            {payoutError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {payoutError}
              </div>
            )}

            <form onSubmit={handleRegisterPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Monto a Liquidar ($ MXN) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Notas / Referencia de Pago</label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                  placeholder="Ej: Transferencia SPEI #48929 / Pago en efectivo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={payoutLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                >
                  {payoutLoading ? 'Registrando...' : 'Confirmar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendedoresPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VendedoresContent />
    </Suspense>
  );
}
