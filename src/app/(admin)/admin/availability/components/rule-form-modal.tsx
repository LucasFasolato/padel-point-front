'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Lun-Vie
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('21:00');
  const [slotMinutos, setSlotMinutos] = useState(60);
  const [error, setError] = useState<string | null>(null);

  // ✅ reset “sano” cada vez que se abre o cambia el preselect
  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCourtId(selectedCourtId || '');
    setSelectedDays([1, 2, 3, 4, 5]);
    setHoraInicio('09:00');
    setHoraFin('21:00');
    setSlotMinutos(60);
    setError(null);
  }, [isOpen, selectedCourtId]);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const selectAllDays = () => setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  const selectWeekdays = () => setSelectedDays([1, 2, 3, 4, 5]);
  const selectWeekend = () => setSelectedDays([0, 6]);

  const previewDaysLabel = useMemo(() => {
    if (selectedDays.length === 0) return '';
    return selectedDays
      .slice()
      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.short)
      .filter(Boolean)
      .join(', ');
  }, [selectedDays]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!courtId) return setError('Seleccioná una cancha');
    if (selectedDays.length === 0) return setError('Seleccioná al menos un día');
    if (horaInicio >= horaFin)
      return setError('La hora de fin debe ser mayor a la de inicio');

    const result = await onSubmit({
      courtId,
      diasSemana: selectedDays,
      horaInicio,
      horaFin,
      slotMinutos,
    });

    if (!result.ok) {
      setError(result.error ?? 'Error al guardar');
      return;
    }

    onClose();
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface shadow-2xl ring-1 ring-border">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface2 ring-1 ring-border">
              <Plus size={20} className="text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-text">Agregar horarios</h3>
              <p className="text-xs text-textMuted">
                Definí cuándo está disponible la cancha
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg p-2 text-textMuted transition-colors hover:bg-surface2 hover:text-text
                       focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
                       disabled:opacity-50"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-5 p-4">
          {/* Court selector */}
          {!selectedCourtId && (
            <div>
              <label className="mb-2 block text-sm font-medium text-textMuted/90">
                Cancha
              </label>
              <select
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition
                           focus:border-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
                           disabled:bg-surface2"
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

          {/* Days */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-textMuted/90">
                Días de la semana
              </label>

              <div className="flex gap-1">
                {[
                  { label: 'L-V', onClick: selectWeekdays },
                  { label: 'S-D', onClick: selectWeekend },
                  { label: 'Todos', onClick: selectAllDays },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={b.onClick}
                    disabled={saving}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors
                               hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
                               disabled:opacity-50"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const active = selectedDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    disabled={saving}
                    className={[
                      'rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg',
                      'disabled:opacity-50',
                      active
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-surface2 text-textMuted hover:bg-surface2/80 ring-1 ring-border',
                    ].join(' ')}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-textMuted/90">
                Hora inicio
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition
                           focus:border-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
                           disabled:bg-surface2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-textMuted/90">
                Hora fin
              </label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition
                           focus:border-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
                           disabled:bg-surface2"
              />
            </div>
          </div>

          {/* Slot duration */}
          <div>
            <label className="mb-2 block text-sm font-medium text-textMuted/90">
              Duración de cada turno
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SLOT_DURATIONS.map((duration) => {
                const active = slotMinutos === duration.value;
                return (
                  <button
                    key={duration.value}
                    type="button"
                    onClick={() => setSlotMinutos(duration.value)}
                    disabled={saving}
                    className={[
                      'rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg',
                      'disabled:opacity-50',
                      active
                        ? 'bg-text text-white'
                        : 'bg-surface2 text-textMuted hover:bg-surface2/80 ring-1 ring-border',
                    ].join(' ')}
                  >
                    {duration.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-border bg-surface2 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-textMuted">
              Vista previa
            </p>

            <p className="text-sm text-text">
              {selectedDays.length > 0 ? (
                <>
                  <span className="font-bold">{previewDaysLabel}</span>
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
            <div className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
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
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-bold text-textMuted transition-colors
                         hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
                         disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || selectedDays.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors
                         hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
                         disabled:opacity-70"
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
