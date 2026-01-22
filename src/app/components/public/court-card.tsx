import { Court, AvailabilitySlot } from '@/types';
import { AvailabilityGrid } from './availability-grid';
import { MapPin } from 'lucide-react';

// 👇 FIX: Add onSlotSelect to the Interface
interface CourtCardProps {
  court: Court;
  slots: AvailabilitySlot[];
  loading: boolean;
  onSlotSelect: (slot: AvailabilitySlot) => void; 
}

export function CourtCard({ court, slots, loading, onSlotSelect }: CourtCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-5 py-4">
        <div>
          <h3 className="font-bold text-slate-900">{court.nombre}</h3>
          <p className="text-xs text-slate-500">{court.superficie} • Techada</p>
        </div>
        <div className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-900 shadow-sm ring-1 ring-slate-100">
           ${court.precioPorHora.toLocaleString()} /h
        </div>
      </div>

      {/* Slots Grid */}
      <div className="p-5">
        <AvailabilityGrid 
          slots={slots} 
          loading={loading} 
          price={court.precioPorHora}
          onSelect={onSlotSelect} // 👈 Pass it down to the grid
        />
      </div>
    </div>
  );
}