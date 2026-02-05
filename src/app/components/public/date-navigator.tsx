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
  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      // opcional: centrar el selected
    }
  }, [selectedDate]);

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-sm supports-[backdrop-filter]:bg-surface/85">
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
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg",
                isSelected
                  ? "border-brand-950 bg-brand-950 text-white shadow-lg shadow-black/15"
                  : "border-border bg-surface text-textMuted hover:bg-surface2 hover:text-text"
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
