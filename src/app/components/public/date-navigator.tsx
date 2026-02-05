'use client';

import { format, isSameDay, isToday, isTomorrow, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

interface DateNavigatorProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
}

export function DateNavigator({ selectedDate, onSelect }: DateNavigatorProps) {
  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected date (UX Polish)
  useEffect(() => {
    if (scrollRef.current) {
      // Simple logic to center could be added here
    }
  }, [selectedDate]);

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div 
        ref={scrollRef}
        className="mx-auto flex max-w-md gap-2 overflow-x-auto px-4 py-3 no-scrollbar sm:max-w-3xl"
      >
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          
          let label = format(date, 'EEE', { locale: es });
          if (isToday(date)) label = 'HOY';
          if (isTomorrow(date)) label = 'MAÑ';

          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelect(date)}
              className={cn(
                "flex min-w-[4.5rem] flex-col items-center justify-center rounded-xl border py-2 transition-all active:scale-95",
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  : "border-slate-100 bg-white text-slate-500 hover:border-slate-300"
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                {label}
              </span>
              <span className="text-xl font-bold leading-none">
                {format(date, 'd')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}