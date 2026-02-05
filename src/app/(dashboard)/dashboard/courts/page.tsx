'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Court } from '@/types';
import { Plus, Edit2, Trash2, Trophy, DollarSign, Layout, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import ImageUploader from '../../../components/ImageUploader';
import * as Dialog from '@radix-ui/react-dialog';

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [editingCourt, setEditingCourt] = useState<Partial<Court> | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 1. Load Data
  useEffect(() => {
    const init = async () => {
      try {
        // Get user's club first (Similar logic to Agenda)
        const clubRes = await api.get('/clubs');
        if (clubRes.data.length > 0) {
          const myClubId = clubRes.data[0].id;
          setClubId(myClubId);

          // Fetch courts for this club [cite: 522]
          const res = await api.get(`/courts/by-club/${myClubId}`);
          setCourts(res.data);
        }
      } catch (error) {
        console.error('Error loading courts', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2. Handlers
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId || !editingCourt) return;
    setSaving(true);

    try {
      if (editingCourt.id) {
        // Update [cite: 556]
        await api.patch(`/courts/${editingCourt.id}`, editingCourt);
        setCourts((prev) =>
          prev.map((c) =>
            c.id === editingCourt.id ? ({ ...c, ...editingCourt } as Court) : c
          )
        );
      } else {
        // Create [cite: 496]
        const payload = {
          ...editingCourt,
          clubId,
          activa: true,
          superficie: editingCourt.superficie || 'Sintético', // Default
        };
        const res = await api.post('/courts', payload);
        setCourts((prev) => [...prev, res.data]);

        // Keep modal open but switch to "Edit" mode so they can upload photo immediately
        setEditingCourt(res.data);
        alert('Cancha creada. Ahora puedes subir la foto.');
        setSaving(false);
        return; // Don't close modal yet
      }
      setIsModalOpen(false);
    } catch (error) {
      alert('Error al guardar cancha');
    } finally {
      setSaving(false);
    }
  };

  const openNew = () => {
    setEditingCourt({ nombre: '', precioPorHora: 0, superficie: 'Sintético' });
    setIsModalOpen(true);
  };

  const openEdit = (court: Court) => {
    setEditingCourt(court);
    setIsModalOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface px-8 py-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text">Mis Canchas</h1>
          <p className="text-sm text-textMuted">
            Administra el inventario y precios de tu club.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground transition-all hover:opacity-95 active:scale-95"
        >
          <Plus size={20} /> Nueva Cancha
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-bg p-8">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-textMuted">
            Cargando...
          </div>
        ) : courts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-surface2 p-16 text-center">
            <div className="mb-4 rounded-full bg-surface p-6 text-textMuted">
              <Trophy size={48} />
            </div>
            <h3 className="text-lg font-bold text-text">No tienes canchas aún</h3>
            <p className="mb-6 max-w-sm text-textMuted">
              Crea tu primera cancha para comenzar a recibir reservas en la Agenda.
            </p>
            <button onClick={openNew} className="font-bold text-primary hover:underline">
              Crear Cancha Ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courts.map((court) => (
              <div
                key={court.id}
                className="group relative overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-border transition-all hover:shadow-lg"
              >
                {/* Image Area */}
                <div className="relative h-48 w-full bg-surface2">
                  {court.primaryImage ? (
                    <img
                      src={court.primaryImage.secureUrl}
                      className="h-full w-full object-cover"
                      alt="Cancha"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-textMuted">
                      <Layout size={32} opacity={0.5} />
                    </div>
                  )}
                  <div className="absolute right-2 top-2 rounded-lg bg-surface/90 px-2 py-1 text-xs font-bold shadow-sm">
                    {court.activa ? (
                      <span className="text-success">Activa</span>
                    ) : (
                      <span className="text-danger">Inactiva</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="mb-1 text-lg font-bold text-text">{court.nombre}</h3>
                  <div className="mb-4 flex items-center justify-between text-sm text-textMuted">
                    <span>{court.superficie}</span>
                    <span className="font-semibold text-text">
                      {formatCurrency(court.precioPorHora)}/h
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(court)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface py-2 text-sm font-semibold text-textMuted hover:bg-surface2"
                    >
                      <Edit2 size={16} /> Editar
                    </button>
                    {/* Delete logic would involve a confirmation modal */}
                    <button className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 text-danger hover:bg-red-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-2xl z-50 animate-slide-up">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-text">
                {editingCourt?.id ? 'Editar Cancha' : 'Nueva Cancha'}
              </h3>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-text">
                    Nombre
                  </label>
                  <input
                    required
                    className="w-full rounded-xl border border-border bg-surface p-3 text-text outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ej: Cancha Central"
                    value={editingCourt?.nombre || ''}
                    onChange={(e) =>
                      setEditingCourt({ ...editingCourt, nombre: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text flex items-center gap-1">
                    <DollarSign size={14} /> Precio / Hora
                  </label>
                  <input
                    required
                    type="number"
                    className="w-full rounded-xl border border-border bg-surface p-3 text-text outline-none focus:ring-2 focus:ring-ring"
                    value={editingCourt?.precioPorHora || ''}
                    onChange={(e) =>
                      setEditingCourt({
                        ...editingCourt,
                        precioPorHora: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-text flex items-center gap-1">
                    <Layout size={14} /> Superficie
                  </label>
                  <select
                    className="w-full rounded-xl border border-border bg-surface p-3 text-text outline-none focus:ring-2 focus:ring-ring"
                    value={editingCourt?.superficie || 'Sintético'}
                    onChange={(e) =>
                      setEditingCourt({ ...editingCourt, superficie: e.target.value })
                    }
                  >
                    <option value="Sintético">Sintético</option>
                    <option value="Cemento">Cemento</option>
                    <option value="Cesped">Césped</option>
                  </select>
                </div>
              </div>

              {/* Image Upload Area - Only visible if court is already created (has ID) */}
              {editingCourt?.id ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <label className="mb-2 block text-sm font-medium text-text">
                    Foto Principal
                  </label>
                  <div className="h-40 w-full">
                    <ImageUploader
                      ownerId={editingCourt.id}
                      kind="COURT_PRIMARY"
                      currentImage={editingCourt.primaryImage?.secureUrl}
                      onUploadComplete={(url: string, secureUrl: string) => {
                        // Update local state to reflect change immediately
                        setEditingCourt((prev) => ({
                          ...prev,
                          primaryPhoto: { url, secureUrl },
                        }));
                        // Update list in background
                        setCourts((prev) =>
                          prev.map((c) =>
                            c.id === editingCourt.id
                              ? { ...c, primaryPhoto: { url, secureUrl } }
                              : c
                          )
                        );
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700">
                  Podrás subir la foto una vez creada la cancha.
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Dialog.Close className="flex-1 rounded-xl border border-border bg-surface py-3 font-semibold text-textMuted hover:bg-surface2">
                  Cancelar
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-70"
                >
                  {saving ? <Loader2 className="animate-spin mx-auto" /> : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
