'use client';

import { useState } from 'react';
import {
  format,
  addDays,
  subDays,
  isToday,
  isTomorrow,
  isYesterday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, RefreshCw } from 'lucide-react';

type AgendaDatePickerProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onRefresh: () => void;
  loading?: boolean;
};

export function AgendaDatePicker({
  selectedDate,
  onDateChange,
  onRefresh,
  loading,
}: AgendaDatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const goToPrevDay = () => onDateChange(subDays(selectedDate, 1));
  const goToNextDay = () => onDateChange(addDays(selectedDate, 1));
  const goToToday = () => onDateChange(new Date());

  const getDateLabel = () => {
    if (isToday(selectedDate)) return 'Hoy';
    if (isTomorrow(selectedDate)) return 'Mañana';
    if (isYesterday(selectedDate)) return 'Ayer';
    return format(selectedDate, "EEEE d 'de' MMMM", { locale: es });
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Prev/Next */}
      <div className="flex items-center rounded-xl bg-surface ring-1 ring-border shadow-sm">
        <button
          onClick={goToPrevDay}
          className="rounded-l-xl border-r border-border p-2.5 transition-colors hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
          title="Día anterior"
        >
          <ChevronLeft size={20} className="text-textMuted" />
        </button>

        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="flex min-w-[200px] items-center justify-center gap-2 px-4 py-2.5 transition-colors hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
        >
          <Calendar size={18} className="text-primary" />
          <span className="font-bold capitalize text-text">{getDateLabel()}</span>
        </button>

        <button
          onClick={goToNextDay}
          className="rounded-r-xl border-l border-border p-2.5 transition-colors hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
          title="Día siguiente"
        >
          <ChevronRight size={20} className="text-textMuted" />
        </button>
      </div>

      {/* Today */}
      {!isToday(selectedDate) && (
        <button
          onClick={goToToday}
          className="rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
        >
          Ir a hoy
        </button>
      )}

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="rounded-xl bg-surface p-2.5 ring-1 ring-border shadow-sm transition-colors hover:bg-surface2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
        title="Actualizar"
      >
        <RefreshCw
          size={20}
          className={`text-textMuted ${loading ? 'animate-spin' : ''}`}
        />
      </button>

      {/* Native date input */}
      {showCalendar && (
        <div className="absolute left-0 top-full z-20 mt-2">
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => {
              if (e.target.value) {
                onDateChange(new Date(e.target.value + 'T12:00:00'));
                setShowCalendar(false);
              }
            }}
            className="rounded-xl bg-surface px-4 py-2 text-sm text-text shadow-lg ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
            autoFocus
            onBlur={() => setTimeout(() => setShowCalendar(false), 200)}
          />
        </div>
      )}
    </div>
  );
}
