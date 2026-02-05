'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { Calendar, LayoutGrid, List, Settings, AlertTriangle } from 'lucide-react';

import { useClubStore } from '@/store/club-store';
import { useAuthStore } from '@/store/auth-store';
import { useAgenda } from '@/hooks/use-agenda';
import { AgendaDatePicker } from './components/agenda-date-picker';
import { AgendaDayView } from './components/agenda-day-view';
import { BlockSlotModal } from './components/block-slot-modal';
import type { AgendaSlot } from '@/types/availability';

type ViewMode = 'grid' | 'list';

type BlockModalState = {
  isOpen: boolean;
  courtId: string | null;
  courtName: string;
  slot: AgendaSlot | null;
};

export default function AvailabilityPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { activeClub } = useClubStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [blockModal, setBlockModal] = useState<BlockModalState>({
    isOpen: false,
    courtId: null,
    courtName: '',
    slot: null,
  });

  const { data, loading, error, fetchAgenda, blockSlot } = useAgenda(activeClub?.id);

  // Fetch agenda when date or club changes
  useEffect(() => {
    if (activeClub?.id) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      fetchAgenda(dateStr);
    }
  }, [activeClub?.id, selectedDate, fetchAgenda]);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleRefresh = useCallback(() => {
    if (activeClub?.id) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      fetchAgenda(dateStr);
    }
  }, [activeClub?.id, selectedDate, fetchAgenda]);

  const handleBlockSlot = useCallback((courtId: string, courtName: string, slot: AgendaSlot) => {
    if (slot.status !== 'free') return;
    setBlockModal({ isOpen: true, courtId, courtName, slot });
  }, []);

  const handleConfirmBlock = useCallback(
    async (reason: string) => {
      if (!blockModal.courtId || !blockModal.slot) {
        return { ok: false, error: 'Datos incompletos' };
      }

      const startTime = format(new Date(blockModal.slot.startAt), 'HH:mm');
      const endTime = format(new Date(blockModal.slot.endAt), 'HH:mm');

      const result = await blockSlot({
        courtId: blockModal.courtId,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        reason: reason || undefined,
        blocked: true,
      });

      if (result.ok) handleRefresh();
      return result;
    },
    [blockModal, blockSlot, selectedDate, handleRefresh]
  );

  const handleCloseBlockModal = useCallback(() => {
    setBlockModal({ isOpen: false, courtId: null, courtName: '', slot: null });
  }, []);

  const handleViewReservation = useCallback(
    (reservationId: string) => {
      router.push(`/admin/bookings?reservationId=${reservationId}`);
    },
    [router]
  );

  // Permission check
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-textMuted">
        <AlertTriangle size={48} className="mb-4 opacity-60 text-warning" />
        <p className="text-sm">No tenés permisos para ver esta sección.</p>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-950 px-4 py-2 text-xs font-bold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
        >
          Volver
        </Link>
      </div>
    );
  }

  // No club selected
  if (!activeClub) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-textMuted">
        <Calendar size={48} className="mb-4 opacity-60 text-textMuted" />
        <p>Seleccioná un club primero.</p>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-brand-950 px-4 py-2 text-xs font-bold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
        >
          Ir al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Agenda</h1>
          <p className="text-textMuted">
            Visualizá y gestioná la disponibilidad de {activeClub.nombre}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/availability/rules"
            className="flex items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-sm font-bold text-text ring-1 ring-border shadow-sm transition hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Configurar horarios</span>
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <AgendaDatePicker
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onRefresh={handleRefresh}
            loading={loading}
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-surface p-1 ring-1 ring-border shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`
              flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
              ${viewMode === 'grid' ? 'bg-brand-950 text-white' : 'text-textMuted hover:bg-surface2 hover:text-text'}
            `}
          >
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Grilla</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`
              flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
              ${viewMode === 'list' ? 'bg-brand-950 text-white' : 'text-textMuted hover:bg-surface2 hover:text-text'}
            `}
          >
            <List size={16} />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-textMuted">Estados:</span>

        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-success/15 ring-1 ring-success/30" />
          <span className="text-textMuted">Disponible</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-primary/15 ring-1 ring-primary/30" />
          <span className="text-textMuted">Confirmada</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-warning/15 ring-1 ring-warning/30" />
          <span className="text-textMuted">En espera</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-surface2 ring-1 ring-border" />
          <span className="text-textMuted">Bloqueado</span>
        </div>
      </div>

      {/* Agenda View */}
      <AgendaDayView
        data={data}
        loading={loading}
        error={error}
        onBlockSlot={handleBlockSlot}
        onViewReservation={handleViewReservation}
        viewMode={viewMode}
      />

      {/* Block Modal */}
      <BlockSlotModal
        isOpen={blockModal.isOpen}
        onClose={handleCloseBlockModal}
        onConfirm={handleConfirmBlock}
        slot={blockModal.slot}
        courtName={blockModal.courtName}
        date={format(selectedDate, 'yyyy-MM-dd')}
      />
    </div>
  );
}
