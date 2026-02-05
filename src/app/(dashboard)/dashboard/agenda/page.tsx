'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { format, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Calendar,
  User,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

// Interfaces matching your PDF [cite: 1047-1059]
interface AgendaItem {
  courtId: string;
  courtNombre: string;
  start: string; // "10:00"
  end: string; // "11:00"
  status: 'free' | 'blocked' | 'occupied';
  detail?: {
    type: 'reservation' | 'override';
    reservationId?: string;
    overrideId?: string;
    clientName?: string; // Enhanced for UI
    price?: number;
  };
}

interface ClubBasic {
  id: string;
  nombre: string;
}

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [club, setClub] = useState<ClubBasic | null>(null);
  const [agenda, setAgenda] = useState<{ courts: string[]; items: AgendaItem[] }>({
    courts: [],
    items: [],
  });
  const [loading, setLoading] = useState(true);

  // Action State
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // 1. Initialize: Find the user's club
  useEffect(() => {
    const fetchMyClub = async () => {
      try {
        // For MVP: We fetch the public list and find one we can access,
        // or assumes the backend has an endpoint for "my-clubs".
        // Here we simulate getting the first club ID the user has access to.
        // Ideally: const res = await api.get('/clubs/my-club');

        // Temporary strategy: Fetch all clubs and pick the first one (assuming single-tenant for now)
        const res = await api.get('/clubs');
        if (res.data.length > 0) {
          setClub(res.data[0]);
        }
      } catch (error) {
        console.error('Error fetching club', error);
      }
    };
    fetchMyClub();
  }, []);

  // 2. Fetch Agenda when Date or Club changes
  useEffect(() => {
    if (!club) return;

    const fetchAgenda = async () => {
      setLoading(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        // Calls the endpoint defined in PDF [cite: 1039]
        const res = await api.get(`/clubs/${club.id}/agenda`, {
          params: { date: dateStr, mode: 'full' },
        });

        // Transform the response to be grid-friendly if the API returns flat list
        // Note: I'm adapting the logic to ensure we have a list of unique courts
        const items: AgendaItem[] = res.data.items || [];
        const uniqueCourts = Array.from(new Set(items.map((i) => i.courtNombre))).sort();

        setAgenda({ courts: uniqueCourts, items });
      } catch (error) {
        console.error('Error fetching agenda', error);
        // Fallback for demo if backend isn't fully ready with data
        setAgenda({ courts: [], items: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchAgenda();
  }, [selectedDate, club]);

  // 3. Handlers
  const handleBlockSlot = async () => {
    if (!selectedItem || !club) return;
    setProcessing(true);
    try {
      // PDF Endpoint [cite: 1060]
      await api.post(`/clubs/${club.id}/agenda/block`, {
        courtId: selectedItem.courtId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedItem.start,
        endTime: selectedItem.end,
        reason: 'Mantenimiento / Bloqueo Manual',
        blocked: true,
      });
      setIsModalOpen(false);
      // Refresh logic would go here (toggle a refresh state)
      alert('Horario bloqueado exitosamente');
    } catch (error) {
      alert('Error al bloquear horario');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnlockSlot = async () => {
    if (!selectedItem || !selectedItem.detail?.overrideId) return;
    setProcessing(true);
    try {
      // PDF Endpoint [cite: 724]
      await api.delete(`/availability/overrides/${selectedItem.detail.overrideId}`);
      setIsModalOpen(false);
      alert('Horario desbloqueado');
    } catch (e) {
      alert('Error al desbloquear');
    } finally {
      setProcessing(false);
    }
  };

  // Helper to render the grid
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00

  return (
    <div className="flex h-full flex-col">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-surface px-6 py-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text">Agenda Diaria</h1>
          <p className="text-sm text-textMuted">{club ? club.nombre : 'Cargando club...'}</p>
        </div>

        <div className="flex items-center gap-4 rounded-xl bg-surface2 p-1">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="rounded-lg p-2 text-textMuted hover:bg-surface hover:shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2 px-2">
            <Calendar size={18} className="text-textMuted" />
            <span className="font-semibold text-text capitalize w-32 text-center">
              {format(selectedDate, 'EEE d MMM', { locale: es })}
            </span>
          </div>

          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="rounded-lg p-2 text-textMuted hover:bg-surface hover:shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* The Grid Content */}
      <div className="flex-1 overflow-auto bg-bg p-6">
        {loading ? (
          <div className="flex h-full items-center justify-center text-textMuted">
            Cargando agenda...
          </div>
        ) : agenda.courts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-textMuted">
            <Calendar size={48} className="mb-4 opacity-20" />
            <p>No hay canchas configuradas o datos disponibles.</p>
          </div>
        ) : (
          <div className="min-w-[800px] rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
            {/* Grid Header (Courts) */}
            <div className="flex border-b border-border bg-surface2">
              <div className="w-20 flex-shrink-0 border-r border-border p-4 font-bold text-textMuted text-center">
                Hora
              </div>
              {agenda.courts.map((courtName, idx) => (
                <div
                  key={idx}
                  className="flex-1 border-r border-border p-4 text-center font-bold text-text last:border-0"
                >
                  {courtName}
                </div>
              ))}
            </div>

            {/* Grid Body (Hours) */}
            <div className="divide-y divide-slate-100">
              {hours.map((hour) => {
                const timeStr = `${hour < 10 ? '0' : ''}${hour}:00`;
                return (
                  <div key={hour} className="flex h-20">
                    <div className="flex w-20 flex-shrink-0 items-center justify-center border-r border-slate-100 bg-surface2 text-sm font-medium text-textMuted">
                      {timeStr}
                    </div>
                    {agenda.courts.map((courtName, idx) => {
                      // Find the item for this slot
                      const item = agenda.items.find(
                        (i) => i.courtNombre === courtName && i.start.startsWith(timeStr)
                      ); // Simplified matching

                      // Mock item if not found (for visual grid structure in this demo)
                      // In prod, you'd strictly render only what exists or "empty" slots
                      const displayItem =
                        item ||
                        ({
                          status: 'free',
                          start: timeStr,
                          end: `${hour + 1}:00`,
                          courtNombre: courtName,
                          courtId: 'mock',
                        } as AgendaItem);

                      return (
                        <div key={idx} className="flex-1 border-r border-slate-100 p-1 last:border-0">
                          <button
                            onClick={() => {
                              setSelectedItem(displayItem);
                              setIsModalOpen(true);
                            }}
                            className={cn(
                              'h-full w-full rounded-lg border px-2 py-1 text-left transition-all hover:scale-[0.98] hover:shadow-md',
                              displayItem.status === 'free' &&
                                'border-slate-100 bg-surface hover:border-brand-300',
                              displayItem.status === 'occupied' &&
                                'border-green-200 bg-green-50 text-green-800',
                              displayItem.status === 'blocked' &&
                                'border-red-200 bg-red-50 text-red-800'
                            )}
                          >
                            {displayItem.status === 'occupied' ? (
                              <>
                                <div className="flex items-center gap-1 text-xs font-bold">
                                  <User size={12} /> {displayItem.detail?.clientName || 'Cliente'}
                                </div>
                                <div className="text-xs opacity-80">Reserva</div>
                              </>
                            ) : displayItem.status === 'blocked' ? (
                              <div className="flex h-full items-center justify-center gap-1 text-xs font-bold text-red-400">
                                <Lock size={14} /> Bloqueado
                              </div>
                            ) : (
                              <div className="hidden h-full items-center justify-center text-xs text-slate-300 group-hover:flex">
                                + Disponble
                              </div>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Management Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-6 shadow-2xl z-50 animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text">Gestionar Horario</h3>
              <Dialog.Close className="text-textMuted hover:text-text">
                <Lock size={18} />
              </Dialog.Close>
            </div>

            {selectedItem && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-surface2 p-3 text-sm text-textMuted">
                  <span className="flex items-center gap-2">
                    <Clock size={16} /> {selectedItem.start} - {selectedItem.end}
                  </span>
                  <span className="font-bold text-text">{selectedItem.courtNombre}</span>
                </div>

                {selectedItem.status === 'free' && (
                  <div className="space-y-3">
                    <p className="text-sm text-textMuted">
                      Este horario está libre. ¿Qué deseas hacer?
                    </p>
                    <button
                      onClick={handleBlockSlot}
                      disabled={processing}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800"
                    >
                      {processing ? (
                        'Procesando...'
                      ) : (
                        <>
                          <Lock size={16} /> Bloquear Horario
                        </>
                      )}
                    </button>
                    <button className="w-full rounded-xl border border-border bg-surface py-3 font-medium text-textMuted hover:bg-surface2">
                      Crear Reserva Manual
                    </button>
                  </div>
                )}

                {selectedItem.status === 'blocked' && (
                  <div className="space-y-3">
                    <p className="text-sm text-danger font-medium bg-red-50 p-3 rounded-lg">
                      Este horario está bloqueado manualmente.
                    </p>
                    <button
                      onClick={handleUnlockSlot}
                      disabled={processing}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-surface py-3 font-bold text-danger hover:bg-red-50"
                    >
                      <Unlock size={16} /> Desbloquear
                    </button>
                  </div>
                )}

                {selectedItem.status === 'occupied' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                      <div className="flex items-center gap-2 mb-2 text-green-700 font-bold">
                        <CheckCircle2 size={18} /> Reserva Confirmada
                      </div>
                      <p className="text-sm text-green-800">
                        Cliente: {selectedItem.detail?.clientName || 'Usuario Web'}
                      </p>
                      <p className="text-sm text-green-800">
                        Pago:{' '}
                        {selectedItem.detail?.price
                          ? formatCurrency(selectedItem.detail.price)
                          : 'Pendiente'}
                      </p>
                    </div>
                    <button className="w-full text-sm text-textMuted hover:text-danger hover:underline">
                      Cancelar Reserva
                    </button>
                  </div>
                )}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
