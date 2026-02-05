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
  loading,
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
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Lock size={20} className="text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Bloquear horario</h3>
              <p className="text-xs text-slate-500">Este slot no estará disponible</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Slot info */}
          <div className="rounded-xl bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Cancha</span>
              <span className="font-bold text-slate-900">{courtName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Fecha</span>
              <span className="font-medium text-slate-700 capitalize">{dateFormatted}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Horario</span>
              <span className="font-bold text-slate-900">
                {startTime} - {endTime}
              </span>
            </div>
          </div>

          {/* Reason input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Motivo <span className="text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Mantenimiento, evento privado..."
              disabled={submitting}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:opacity-70"
            />
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
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
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