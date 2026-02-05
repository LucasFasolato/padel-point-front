'use client';

import { useState } from 'react';
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from 'date-fns';
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
    <div className="flex items-center gap-2">
      {/* Prev/Next buttons */}
      <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={goToPrevDay}
          className="p-2.5 hover:bg-slate-50 rounded-l-xl border-r border-slate-200 transition-colors"
          title="Día anterior"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>

        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 min-w-[200px] justify-center transition-colors"
        >
          <Calendar size={18} className="text-blue-600" />
          <span className="font-bold text-slate-900 capitalize">
            {getDateLabel()}
          </span>
        </button>

        <button
          onClick={goToNextDay}
          className="p-2.5 hover:bg-slate-50 rounded-r-xl border-l border-slate-200 transition-colors"
          title="Día siguiente"
        >
          <ChevronRight size={20} className="text-slate-600" />
        </button>
      </div>

      {/* Today button */}
      {!isToday(selectedDate) && (
        <button
          onClick={goToToday}
          className="px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
        >
          Ir a hoy
        </button>
      )}

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={loading}
        className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
        title="Actualizar"
      >
        <RefreshCw
          size={20}
          className={`text-slate-600 ${loading ? 'animate-spin' : ''}`}
        />
      </button>

      {/* Native date input (hidden but functional) */}
      {showCalendar && (
        <div className="absolute mt-2 top-full left-0 z-20">
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => {
              if (e.target.value) {
                onDateChange(new Date(e.target.value + 'T12:00:00'));
                setShowCalendar(false);
              }
            }}
            className="px-4 py-2 rounded-xl border border-slate-200 shadow-lg bg-white"
            autoFocus
            onBlur={() => setTimeout(() => setShowCalendar(false), 200)}
          />
        </div>
      )}
    </div>
  );
}