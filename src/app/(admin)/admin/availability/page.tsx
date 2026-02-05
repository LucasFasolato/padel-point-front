'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  Calendar,
  LayoutGrid,
  List,
  Settings,
  AlertTriangle,
} from 'lucide-react';

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

  const handleBlockSlot = useCallback(
    (courtId: string, courtName: string, slot: AgendaSlot) => {
      if (slot.status !== 'free') return;
      setBlockModal({
        isOpen: true,
        courtId,
        courtName,
        slot,
      });
    },
    []
  );

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

      if (result.ok) {
        // Refresh agenda after blocking
        handleRefresh();
      }

      return result;
    },
    [blockModal, blockSlot, selectedDate, handleRefresh]
  );

  const handleCloseBlockModal = useCallback(() => {
    setBlockModal({
      isOpen: false,
      courtId: null,
      courtName: '',
      slot: null,
    });
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
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <AlertTriangle size={48} className="mb-4 opacity-50" />
        <p className="text-sm">No tenés permisos para ver esta sección.</p>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          Volver
        </Link>
      </div>
    );
  }

  // No club selected
  if (!activeClub) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <Calendar size={48} className="mb-4 opacity-50" />
        <p>Seleccioná un club primero.</p>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          Ir al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
          <p className="text-slate-500">
            Visualizá y gestioná la disponibilidad de {activeClub.nombre}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/availability/rules"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Configurar horarios</span>
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative">
          <AgendaDatePicker
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onRefresh={handleRefresh}
            loading={loading}
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Grilla</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <List size={16} />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-slate-500">Estados:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" />
          <span className="text-slate-600">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          <span className="text-slate-600">Confirmada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          <span className="text-slate-600">En espera</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
          <span className="text-slate-600">Bloqueado</span>
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