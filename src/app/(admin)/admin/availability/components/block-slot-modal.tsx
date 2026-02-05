'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Lock, Loader2, AlertTriangle } from 'lucide-react';
import type { AgendaSlot } from '@/types/availability';

type BlockSlotModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<{ ok: boolean; error?: string }>;
  slot: AgendaSlot | null;
  courtName: string;
  date: string;
  loading?: boolean;
};

export function BlockSlotModal({
  isOpen,
  onClose,
  onConfirm,
  slot,
  courtName,
  date,
}: BlockSlotModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !slot) return null;

  const startTime = format(parseISO(slot.startAt), 'HH:mm');
  const endTime = format(parseISO(slot.endAt), 'HH:mm');
  const dateFormatted = format(parseISO(date), "EEEE d 'de' MMMM", { locale: es });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await onConfirm(reason.trim());

    if (!result.ok) {
      setError(result.error ?? 'Error al bloquear el slot');
      setSubmitting(false);
    } else {
      setReason('');
      onClose();
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setReason('');
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
      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface2 ring-1 ring-border">
              <Lock size={20} className="text-textMuted" />
            </div>
            <div>
              <h3 className="font-bold text-text">Bloquear horario</h3>
              <p className="text-xs text-textMuted">
                Este slot no estará disponible
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-textMuted transition-colors hover:bg-surface2 hover:text-text focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Slot info */}
          <div className="space-y-2 rounded-xl bg-surface2 p-4 ring-1 ring-border">
            <div className="flex justify-between text-sm">
              <span className="text-textMuted">Cancha</span>
              <span className="font-bold text-text">{courtName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-textMuted">Fecha</span>
              <span className="font-medium capitalize text-textMuted/90">
                {dateFormatted}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-textMuted">Horario</span>
              <span className="font-bold text-text">
                {startTime} - {endTime}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1 block text-sm font-medium text-textMuted/90">
              Motivo <span className="text-textMuted/70">(opcional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Mantenimiento, evento privado..."
              disabled={submitting}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none transition
                         focus:border-primary focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
                         disabled:bg-surface2 disabled:opacity-70"
            />
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
              disabled={submitting}
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-bold text-textMuted transition-colors
                         hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
                         disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors
                         hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg
                         disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Bloqueando...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Bloquear
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
