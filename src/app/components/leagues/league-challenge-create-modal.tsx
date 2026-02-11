'use client';

import { useMemo, useState } from 'react';
import Modal from '@/app/components/ui/modal';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import type { CreateLeagueChallengePayload, LeagueMember } from '@/types/leagues';

interface LeagueChallengeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: LeagueMember[];
  currentUserId?: string;
  isPending?: boolean;
  onSubmit: (payload: CreateLeagueChallengePayload) => void;
}

export function LeagueChallengeCreateModal({
  isOpen,
  onClose,
  members,
  currentUserId,
  isPending,
  onSubmit,
}: LeagueChallengeCreateModalProps) {
  const [opponentUserId, setOpponentUserId] = useState('');
  const [message, setMessage] = useState('');

  const opponents = useMemo(
    () => members.filter((m) => m.userId !== currentUserId),
    [members, currentUserId]
  );

  const handleClose = () => {
    if (isPending) return;
    setOpponentUserId('');
    setMessage('');
    onClose();
  };

  const handleSubmit = () => {
    if (!opponentUserId || isPending) return;
    onSubmit({
      opponentUserId,
      message: message.trim() || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo desafío">
      <div className="space-y-4">
        <div>
          <label htmlFor="league-challenge-opponent" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Rival
          </label>
          <select
            id="league-challenge-opponent"
            value={opponentUserId}
            onChange={(e) => setOpponentUserId(e.target.value)}
            disabled={isPending}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Seleccioná un rival</option>
            {opponents.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.displayName || 'Jugador'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="league-challenge-message" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Mensaje <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <Textarea
            id="league-challenge-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isPending}
            maxLength={240}
            placeholder="Ej: ¿Jugamos esta semana?"
            rows={3}
            className="min-h-[84px] rounded-xl border-slate-300 focus-visible:ring-emerald-500"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSubmit} loading={isPending} disabled={!opponentUserId}>
            Desafiar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
