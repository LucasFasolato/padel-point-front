'use client';

import { useState } from 'react';
import Modal from '@/app/components/ui/modal';
import { Button } from '@/app/components/ui/button';

const DISPUTE_REASONS = [
  { value: 'wrong_score', label: 'Resultado incorrecto' },
  { value: 'wrong_winner', label: 'Ganador incorrecto' },
  { value: 'match_not_played', label: 'El partido no se jugó' },
  { value: 'other', label: 'Otro motivo' },
] as const;

export type DisputeReason = (typeof DISPUTE_REASONS)[number]['value'];

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, message?: string) => void;
  loading?: boolean;
}

export function DisputeModal({ isOpen, onClose, onSubmit, loading }: DisputeModalProps) {
  const [reason, setReason] = useState<string>('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit(reason, message.trim() || undefined);
  };

  const handleClose = () => {
    if (loading) return;
    setReason('');
    setMessage('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Disputar resultado">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Si creés que el resultado es incorrecto, podés disputarlo. Un administrador revisará el caso.
        </p>

        {/* Reason select */}
        <div>
          <label htmlFor="dispute-reason" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Motivo
          </label>
          <select
            id="dispute-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Seleccioná un motivo</option>
            {DISPUTE_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Optional message */}
        <div>
          <label htmlFor="dispute-message" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Detalle <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea
            id="dispute-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explicá brevemente qué ocurrió..."
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleSubmit}
            loading={loading}
            disabled={!reason}
            className="flex-1"
          >
            Enviar disputa
          </Button>
        </div>
      </div>
    </Modal>
  );
}
