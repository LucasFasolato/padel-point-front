'use client';

import { motion } from 'framer-motion';
import { AvailabilitySlot } from '@/types';
import { cn } from '@/lib/utils';
import { Loader2, Lock, Clock } from 'lucide-react';

interface AvailabilityGridProps {
  slots: AvailabilitySlot[];
  loading: boolean;
  onSelect: (slot: AvailabilitySlot) => void;
  price?: number; // Optional: Pass the court price to display it
}

export function AvailabilityGrid({ slots, loading, onSelect, price = 32000 }: AvailabilityGridProps) {
  
  // 1. Loading State (Skeleton UI)
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse border border-slate-200" />
        ))}
      </div>
    );
  }

  // 2. Empty State
  if (!slots || slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
        <div className="p-3 bg-white rounded-full shadow-sm mb-3">
          <Clock className="text-slate-400" size={24} />
        </div>
        <p className="text-slate-900 font-medium">No hay turnos disponibles</p>
        <p className="text-sm text-slate-500">Prueba cambiando la fecha o el club.</p>
      </div>
    );
  }

  // 3. The Grid
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {slots.map((slot, index) => {
        const isLocked = slot.ocupado;
        
        return (
          <motion.button
            key={`${slot.courtId}-${slot.horaInicio}-${index}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }} // Staggered animation
            onClick={() => !isLocked && onSelect(slot)}
            disabled={isLocked}
            className={cn(
              "group relative flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all duration-200",
              
              // Styles for OCCUPIED
              isLocked 
                ? "bg-slate-50 border-slate-100 cursor-not-allowed opacity-70"
                
              // Styles for AVAILABLE
                : "bg-white border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md hover:-translate-y-1 active:scale-95 active:shadow-sm"
            )}
          >
            {/* Time Label */}
            <span className={cn(
              "text-lg font-bold tracking-tight",
              isLocked ? "text-slate-400 decoration-slate-300" : "text-slate-700 group-hover:text-blue-600"
            )}>
              {slot.horaInicio}
            </span>

            {/* Subtext (Price or Status) */}
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider flex items-center gap-1">
              {isLocked ? (
                <span className="text-slate-400 flex items-center gap-1">
                  <Lock size={10} /> Ocupado
                </span>
              ) : (
                <span className="text-slate-500 group-hover:text-blue-500 transition-colors">
                  $ {price.toLocaleString()}
                </span>
              )}
            </span>

            {/* Selection Indicator (Blue Dot) */}
            {!isLocked && (
              <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}