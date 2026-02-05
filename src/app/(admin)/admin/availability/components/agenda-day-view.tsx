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
      <div className="rounded-2xl bg-surface p-6 ring-1 ring-border">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-surface p-6 ring-1 ring-border">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle size={48} className="mb-4 text-warning" />
          <p className="font-medium text-textMuted">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.courts.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-6 ring-1 ring-border">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar size={48} className="mb-4 text-textMuted/40" />
          <p className="text-textMuted">No hay canchas configuradas</p>
          <p className="mt-1 text-sm text-textMuted/70">
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
            className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border"
          >
            <div className="border-b border-border bg-surface2 px-4 py-3">
              <h3 className="font-bold text-text">{court.name}</h3>
              <p className="text-xs text-textMuted">
                {court.slots.length} horarios disponibles
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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

  // Grid view
  return (
    <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface2">
              <th className="sticky left-0 z-10 min-w-[80px] bg-surface2 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-textMuted">
                Hora
              </th>
              {data.courts.map((court) => (
                <th
                  key={court.courtId}
                  className="min-w-[150px] px-4 py-3 text-center text-sm font-bold text-text"
                >
                  {court.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {timeSlots.map((time) => (
              <tr
                key={time}
                className="border-b border-border/60 hover:bg-surface2/60"
              >
                <td className="sticky left-0 z-10 bg-surface px-4 py-2 text-sm font-bold text-textMuted">
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
                        <div className="h-10 rounded-lg bg-surface2 ring-1 ring-border border-dashed" />
                      </td>
                    );
                  }

                  return (
                    <td key={`${court.courtId}-${time}`} className="px-2 py-2">
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
    <div className="rounded-2xl bg-surface p-6 ring-1 ring-border">
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-6 w-32 animate-pulse rounded bg-surface2" />
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
