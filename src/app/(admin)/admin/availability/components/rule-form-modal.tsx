'use client';

import { useState } from 'react';
import { X, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { DAYS_OF_WEEK } from '@/types/availability';
import type { Court } from '@/types';

type RuleFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    courtId: string;
    diasSemana: number[];
    horaInicio: string;
    horaFin: string;
    slotMinutos: number;
  }) => Promise<{ ok: boolean; error?: string }>;
  courts: Court[];
  selectedCourtId?: string;
  saving?: boolean;
};

const SLOT_DURATIONS = [
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora 30 min' },
  { value: 120, label: '2 horas' },
];

export function RuleFormModal({
  isOpen,
  onClose,
  onSubmit,
  courts,
  selectedCourtId,
  saving,
}: RuleFormModalProps) {
  const [courtId, setCourtId] = useState(selectedCourtId || '');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('21:00');
  const [slotMinutos, setSlotMinutos] = useState(60);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectAllDays = () => {
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const selectWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const selectWeekend = () => {
    setSelectedDays([0, 6]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!courtId) {
      setError('Seleccioná una cancha');
      return;
    }

    if (selectedDays.length === 0) {
      setError('Seleccioná al menos un día');
      return;
    }

    if (horaInicio >= horaFin) {
      setError('La hora de fin debe ser mayor a la de inicio');
      return;
    }

    const result = await onSubmit({
      courtId,
      diasSemana: selectedDays,
      horaInicio,
      horaFin,
      slotMinutos,
    });

    if (!result.ok) {
      setError(result.error ?? 'Error al guardar');
    } else {
      // Reset and close
      setSelectedDays([1, 2, 3, 4, 5]);
      setHoraInicio('09:00');
      setHoraFin('21:00');
      setSlotMinutos(60);
      setError(null);
      onClose();
    }
  };

  const handleClose = () => {
    if (!saving) {
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Plus size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Agregar horarios</h3>
              <p className="text-xs text-slate-500">Define cuándo está disponible la cancha</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Court selector (only if not preselected) */}
          {!selectedCourtId && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cancha
              </label>
              <select
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
              >
                <option value="">Seleccionar cancha...</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Days selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Días de la semana
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={selectWeekdays}
                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  L-V
                </button>
                <button
                  type="button"
                  onClick={selectWeekend}
                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  S-D
                </button>
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  Todos
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedDays.includes(day.value)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } disabled:opacity-50`}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hora inicio
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hora fin
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                disabled={saving}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Slot duration */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duración de cada turno
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SLOT_DURATIONS.map((duration) => (
                <button
                  key={duration.value}
                  type="button"
                  onClick={() => setSlotMinutos(duration.value)}
                  disabled={saving}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    slotMinutos === duration.value
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } disabled:opacity-50`}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">
              Vista previa
            </p>
            <p className="text-sm text-blue-900">
              {selectedDays.length > 0 ? (
                <>
                  <span className="font-bold">
                    {selectedDays
                      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                      .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.short)
                      .join(', ')}
                  </span>
                  {' de '}
                  <span className="font-bold">{horaInicio}</span>
                  {' a '}
                  <span className="font-bold">{horaFin}</span>
                  {' • turnos de '}
                  <span className="font-bold">{slotMinutos} min</span>
                </>
              ) : (
                'Seleccioná al menos un día'
              )}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || selectedDays.length === 0}
              className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-500 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Crear horarios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}