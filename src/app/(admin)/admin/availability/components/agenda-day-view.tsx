'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Loader2, Calendar, AlertTriangle } from 'lucide-react';
import { SlotCard, SlotCardSkeleton } from './slot-card';
import type { AgendaResponse, AgendaSlot } from '@/types/availability';

type AgendaDayViewProps = {
  data: AgendaResponse | null;
  loading: boolean;
  error: string | null;
  onBlockSlot: (courtId: string, courtName: string, slot: AgendaSlot) => void;
  onViewReservation?: (reservationId: string) => void;
  viewMode: 'grid' | 'list';
};

export function AgendaDayView({
  data,
  loading,
  error,
  onBlockSlot,
  onViewReservation,
  viewMode,
}: AgendaDayViewProps) {
  // Get unique time slots across all courts
  const timeSlots = useMemo(() => {
    if (!data?.courts.length) return [];

    const times = new Set<string>();
    data.courts.forEach((court) => {
      court.slots.forEach((slot) => {
        times.add(format(parseISO(slot.startAt), 'HH:mm'));
      });
    });

    return Array.from(times).sort();
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle size={48} className="text-amber-500 mb-4" />
          <p className="text-slate-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.courts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar size={48} className="text-slate-300 mb-4" />
          <p className="text-slate-500">No hay canchas configuradas</p>
          <p className="text-sm text-slate-400 mt-1">
            Agregá canchas desde la sección de Canchas
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {data.courts.map((court) => (
          <div
            key={court.courtId}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
          >
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-900">{court.name}</h3>
              <p className="text-xs text-slate-500">
                {court.slots.length} horarios disponibles
              </p>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {court.slots.map((slot, idx) => (
                <SlotCard
                  key={`${court.courtId}-${idx}`}
                  slot={slot}
                  compact
                  onBlock={() => onBlockSlot(court.courtId, court.name, slot)}
                  onViewReservation={onViewReservation}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid view - Calendar style
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 z-10 min-w-[80px]">
                Hora
              </th>
              {data.courts.map((court) => (
                <th
                  key={court.courtId}
                  className="px-4 py-3 text-center text-sm font-bold text-slate-900 min-w-[150px]"
                >
                  {court.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-2 text-sm font-bold text-slate-600 sticky left-0 bg-white z-10">
                  {time}
                </td>
                {data.courts.map((court) => {
                  const slot = court.slots.find(
                    (s) => format(parseISO(s.startAt), 'HH:mm') === time
                  );

                  if (!slot) {
                    return (
                      <td
                        key={`${court.courtId}-${time}`}
                        className="px-2 py-2 text-center"
                      >
                        <div className="h-10 rounded-lg bg-slate-50 border border-dashed border-slate-200" />
                      </td>
                    );
                  }

                  return (
                    <td
                      key={`${court.courtId}-${time}`}
                      className="px-2 py-2"
                    >
                      <SlotCard
                        slot={slot}
                        compact
                        onBlock={() => onBlockSlot(court.courtId, court.name, slot)}
                        onViewReservation={onViewReservation}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AgendaDayViewSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-6 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, j) => (
                <SlotCardSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}