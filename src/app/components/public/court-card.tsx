import { Court, AvailabilitySlot } from '@/types';
import { AvailabilityGrid } from './availability-grid';
import { AlertTriangle } from 'lucide-react';

interface CourtCardProps {
  court: Court;
  slots: AvailabilitySlot[];
  loading: boolean;
  onSlotSelect: (slot: AvailabilitySlot) => void;
  error?: string | null;
}

export function CourtCard({
  court,
  slots,
  loading,
  error,
  onSlotSelect,
}: CourtCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-5 py-4">
        <div>
          <h3 className="font-bold text-slate-900">{court.nombre}</h3>
          <p className="text-xs text-slate-500">
            {court.superficie} • Techada
          </p>
        </div>

        <div className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-900 shadow-sm ring-1 ring-slate-100">
          ${court.precioPorHora.toLocaleString()} /h
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
            <AlertTriangle className="h-6 w-6 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              No pudimos cargar los horarios
            </p>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        )}

        {/* Normal / Loading / Empty handled inside grid */}
        {!error && (
          <AvailabilityGrid
            slots={slots}
            loading={loading}
            price={court.precioPorHora}
            onSelect={onSlotSelect}
          />
        )}
      </div>
    </div>
  );
}
