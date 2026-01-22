'use client';

import { Court, AvailabilitySlot } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Clock, Info } from 'lucide-react';
import { useBookingStore } from '@/store/booking-store';

interface CourtCardProps {
  court: Court;
  slots: AvailabilitySlot[];
  loading: boolean;
}

export function CourtCard({ court, slots, loading }: CourtCardProps) {
  const setTime = useBookingStore(s => s.setTime);
  const setCourt = useBookingStore(s => s.setCourt);

  const handleSlotClick = (time: string, price: number) => {
    setCourt(court);
    setTime(time);
    // This will trigger the Drawer in the parent page
  };

  // Filter only available slots (and future ones if today)
  const availableSlots = slots.filter(s => s.available);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Court Header */}
      <div className="flex items-stretch border-b border-slate-100">
        <div className="relative w-24 bg-slate-100 sm:w-32">
          {court.primaryImage ? (
            <img 
              src={court.primaryImage.secureUrl} 
              className="h-full w-full object-cover" 
              alt={court.nombre} 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-300">
              <Info size={24} />
            </div>
          )}
        </div>
        
        <div className="flex flex-1 flex-col justify-center p-4">
          <div className="flex justify-between">
            <h3 className="font-bold text-slate-900">{court.nombre}</h3>
            <span className="font-bold text-blue-600">{formatCurrency(court.precioPorHora)}</span>
          </div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{court.superficie}</p>
          
          <div className="mt-2 flex items-center gap-1.5">
             {loading ? (
                <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
             ) : availableSlots.length > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-bold text-green-700">
                   <Clock size={12} /> {availableSlots.length} Turnos Libres
                </span>
             ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">
                   Sin turnos disponibles
                </span>
             )}
          </div>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="bg-slate-50/50 p-4">
        {loading ? (
           <div className="flex gap-2">
              {[1,2,3].map(i => <div key={i} className="h-9 w-16 animate-pulse rounded-lg bg-slate-200"/>)}
           </div>
        ) : availableSlots.length > 0 ? (
           <div className="flex flex-wrap gap-2">
             {availableSlots.map(slot => (
               <button
                 key={slot.startTime}
                 onClick={() => handleSlotClick(slot.startTime, slot.price || court.precioPorHora)}
                 className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-600 hover:text-white active:scale-95"
               >
                 {slot.startTime}
               </button>
             ))}
           </div>
        ) : (
           <div className="py-2 text-center text-sm text-slate-400 italic">
             No hay horarios disponibles para esta fecha.
           </div>
        )}
      </div>
    </div>
  );
}