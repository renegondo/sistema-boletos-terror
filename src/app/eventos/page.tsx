'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Plus, 
  MapPin, 
  Clock, 
  Ticket, 
  Store, 
  DollarSign, 
  Trash2, 
  AlertCircle,
  Sparkles,
  Layers,
  Pencil
} from 'lucide-react';
import { EventItem, User } from '@/types';

export const dynamic = 'force-dynamic';

export default function EventosPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Event Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('20:00');
  const [bannerUrl, setBannerUrl] = useState('');
  
  // Tiers builder
  const [tiers, setTiers] = useState<Array<{ name: string; price: number; capacity: number; description: string }>>([
    { name: 'General', price: 300, capacity: 500, description: 'Acceso general al recinto' },
    { name: 'VIP', price: 750, capacity: 150, description: 'Zona preferencial con barra' },
  ]);

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete event state
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/events/${deletingEvent.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingEvent(null);
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar el evento');
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el evento');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Edit event state
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventTime, setEditEventTime] = useState('20:00');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'draft' | 'completed' | 'cancelled'>('active');
  const [editTiers, setEditTiers] = useState<Array<{ id?: string; name: string; price: number; capacity: number; description: string }>>([]);
  const [editModalLoading, setEditModalLoading] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  const handleOpenEdit = (evt: EventItem) => {
    setEditingEvent(evt);
    setEditTitle(evt.title);
    setEditDescription(evt.description || '');
    setEditLocation(evt.location);
    setEditEventDate(evt.event_date);
    setEditEventTime(evt.event_time);
    setEditBannerUrl(evt.banner_url || '');
    setEditStatus(evt.status || 'active');
    setEditTiers(
      (evt.tiers && evt.tiers.length > 0)
        ? evt.tiers.map(t => ({
            id: t.id,
            name: t.name,
            price: t.price,
            capacity: t.capacity,
            description: t.description || '',
          }))
        : [{ name: 'General', price: 200, capacity: 100, description: '' }]
    );
    setEditModalError('');
  };

  const handleAddEditTierRow = () => {
    setEditTiers(prev => [
      ...prev,
      { name: `Zona ${prev.length + 1}`, price: 350, capacity: 100, description: '' },
    ]);
  };

  const handleRemoveEditTierRow = (index: number) => {
    if (editTiers.length <= 1) return;
    setEditTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditTierChange = (index: number, field: string, val: any) => {
    setEditTiers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setEditModalLoading(true);
    setEditModalError('');

    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          location: editLocation,
          event_date: editEventDate,
          event_time: editEventTime,
          banner_url: editBannerUrl || undefined,
          status: editStatus,
          tiers: editTiers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al actualizar evento');

      setEditingEvent(null);
      await loadData();
    } catch (err: any) {
      setEditModalError(err.message);
    } finally {
      setEditModalLoading(false);
    }
  };

  const loadData = async () => {
    try {
      const [userRes, eventsRes] = await Promise.all([
        fetch('/api/auth/me', { cache: 'no-store' }),
        fetch('/api/events', { cache: 'no-store' }),
      ]);

      const userData = await userRes.json();
      if (!userData?.user) {
        router.push('/login');
        return;
      }
      setCurrentUser(userData.user);

      const eventsData = await eventsRes.json();
      setEvents(eventsData.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleAddTierRow = () => {
    setTiers(prev => [
      ...prev,
      { name: `Zona ${prev.length + 1}`, price: 400, capacity: 100, description: '' },
    ]);
  };

  const handleRemoveTierRow = (index: number) => {
    if (tiers.length <= 1) return;
    setTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: string, val: any) => {
    setTiers(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          event_date: eventDate,
          event_time: eventTime,
          banner_url: bannerUrl || undefined,
          tiers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear evento');

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setLocation('');
      setEventDate('');
      setEventTime('20:00');
      setBannerUrl('');
      await loadData();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
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
              <Calendar className="w-5 h-5" />
            </div>
            Cartelera de Eventos
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Administra los eventos, tipos de entradas, precios y disponibilidad en taquilla.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Dar de Alta Nuevo Evento</span>
          </button>
        )}
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map((evt) => (
          <div
            key={evt.id}
            className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col"
          >
            {evt.banner_url && (
              <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                <img
                  src={evt.banner_url}
                  alt={evt.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-emerald-800 font-extrabold border border-emerald-200 uppercase shadow-xs">
                  {evt.status}
                </span>
              </div>
            )}

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{evt.title}</h2>
                <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{evt.event_date} a las {evt.event_time} hrs</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{evt.location}</span>
                  </p>
                </div>

                {evt.description && (
                  <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                    {evt.description}
                  </p>
                )}
              </div>

              {/* Tiers List */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tipos de Entrada Disponibles:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {evt.tiers?.map((tier) => (
                    <div
                      key={tier.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{tier.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {tier.sold_count}/{tier.capacity} vendidos
                        </span>
                      </div>
                      <span className="font-mono font-extrabold text-emerald-600 text-sm">
                        ${tier.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Total recaudado: <strong className="text-emerald-700 font-mono font-bold">${(evt.total_revenue || 0).toFixed(2)}</strong>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(evt)}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition-colors"
                        title="Editar Evento"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingEvent(evt)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                        title="Eliminar Evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <Link
                    href="/pos"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Cobrar en Taquilla</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Dar de Alta Evento
            </h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">
              Registra los datos del concierto, festival o evento y define sus zonas o tipos de boletos.
            </p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Título del Evento *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: Festival Electrónico Solaris 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Fecha del Evento *</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Hora de Inicio *</label>
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Ubicación / Recinto *</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Ej: Auditorio Metropolitano"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">URL de Banner Flyer</label>
                <input
                  type="url"
                  value={bannerUrl}
                  onChange={e => setBannerUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Tiers Configuration */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tipos de Entrada / Zonas
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTierRow}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Zona</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          required
                          value={tier.name}
                          onChange={e => handleTierChange(idx, 'name', e.target.value)}
                          placeholder="Nombre (ej: VIP)"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          step="any"
                          required
                          value={tier.price}
                          onChange={e => handleTierChange(idx, 'price', Number(e.target.value))}
                          placeholder="Precio ($)"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          required
                          value={tier.capacity}
                          onChange={e => handleTierChange(idx, 'capacity', Number(e.target.value))}
                          placeholder="Cupo"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTierRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {modalLoading ? 'Creando evento...' : 'Guardar y Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar este evento?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Estás a punto de eliminar permanentemente <strong className="text-slate-800">{deletingEvent.title}</strong>. Esta acción eliminará el evento, sus zonas y sus boletos registrados.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingEvent(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md shadow-red-600/20 transition-all disabled:opacity-50"
              >
                {deleteLoading ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-indigo-600" />
              Editar Evento
            </h2>
            <p className="text-xs text-slate-500 mb-6 font-medium">
              Modifica la información general, cartelera, fecha, recinto y tipos de boletos de este evento.
            </p>

            {editModalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {editModalError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Título del Evento *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder="Título del evento"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={editEventDate}
                    onChange={e => setEditEventDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Hora *</label>
                  <input
                    type="time"
                    required
                    value={editEventTime}
                    onChange={e => setEditEventTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Estado</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="active">Activo 🟢</option>
                    <option value="draft">Borrador 🟡</option>
                    <option value="completed">Concluido ⚪</option>
                    <option value="cancelled">Cancelado 🔴</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Ubicación / Recinto *</label>
                <input
                  type="text"
                  required
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="Lugar del evento"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">URL de Banner Flyer</label>
                <input
                  type="url"
                  value={editBannerUrl}
                  onChange={e => setEditBannerUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Descripción del Evento</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="Detalles sobre el evento..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Edit Tiers Configuration */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tipos de Entrada / Zonas
                  </label>
                  <button
                    type="button"
                    onClick={handleAddEditTierRow}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Zona</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {editTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          required
                          value={tier.name}
                          onChange={e => handleEditTierChange(idx, 'name', e.target.value)}
                          placeholder="Nombre (ej: VIP)"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          step="any"
                          required
                          value={tier.price}
                          onChange={e => handleEditTierChange(idx, 'price', Number(e.target.value))}
                          placeholder="Precio ($)"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <input
                          type="number"
                          required
                          value={tier.capacity}
                          onChange={e => handleEditTierChange(idx, 'capacity', Number(e.target.value))}
                          placeholder="Cupo"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono font-bold"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveEditTierRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editModalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  {editModalLoading ? 'Guardando cambios...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
