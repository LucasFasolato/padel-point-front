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
    <div className="overflow-hidden rounded-3xl bg-surface shadow-sm ring-1 ring-border transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-surface2/60 px-5 py-4">
        <div>
          <h3 className="font-bold text-text">{court.nombre}</h3>
          <p className="text-xs text-textMuted">
            {court.superficie} • Techada
          </p>
        </div>

        <div className="rounded-lg bg-surface px-2.5 py-1 text-xs font-bold text-text shadow-sm ring-1 ring-border">
          ${court.precioPorHora.toLocaleString()} /h
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface2 py-8 text-center">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <p className="text-sm font-medium text-text">
              No pudimos cargar los horarios
            </p>
            <p className="text-xs text-textMuted">{error}</p>
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
