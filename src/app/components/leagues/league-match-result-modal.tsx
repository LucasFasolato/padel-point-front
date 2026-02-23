'use client';

import { useEffect, useMemo, useState } from 'react';
import Modal from '@/app/components/ui/modal';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import type { CaptureLeagueMatchResultPayload, LeagueMatch } from '@/types/leagues';

interface LeagueMatchResultModalProps {
  isOpen: boolean;
  match: LeagueMatch | null;
  isPending?: boolean;
  onClose: () => void;
  onSubmit: (payload: CaptureLeagueMatchResultPayload) => void;
}

type SetDraft = { a: number | ''; b: number | '' };

export function LeagueMatchResultModal({
  isOpen,
  match,
  isPending,
  onClose,
  onSubmit,
}: LeagueMatchResultModalProps) {
  const [sets, setSets] = useState<SetDraft[]>([
    { a: '', b: '' },
    { a: '', b: '' },
  ]);
  const [playedAt, setPlayedAt] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSets([{ a: '', b: '' }, { a: '', b: '' }]);
    setPlayedAt('');
    setError('');
  }, [isOpen, match?.id]);

  const teamA = useMemo(
    () => (match?.teamA ?? []).map((player) => player.displayName).join(' / '),
    [match]
  );
  const teamB = useMemo(
    () => (match?.teamB ?? []).map((player) => player.displayName).join(' / '),
    [match]
  );

  const updateSet = (idx: number, team: 'a' | 'b', value: string) => {
    const next = [...sets];
    next[idx] = {
      ...next[idx],
      [team]: value === '' ? '' : Math.min(7, Math.max(0, Number(value))),
    };
    setSets(next);
  };

  const addSet = () => {
    if (sets.length >= 3) return;
    setSets((prev) => [...prev, { a: '', b: '' }]);
  };

  const removeSet = () => {
    if (sets.length <= 1) return;
    setSets((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    const filledSets = sets
      .filter((set) => set.a !== '' && set.b !== '')
      .map((set) => ({ a: Number(set.a), b: Number(set.b) }));

    if (filledSets.length < 2) {
      setError('Ingresá 2 o 3 sets.');
      return;
    }

    setError('');
    onSubmit({
      sets: filledSets,
      playedAt: playedAt || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cargar resultado">
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Partido</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{teamA || 'Equipo A'}</p>
          <p className="text-xs text-slate-500">vs</p>
          <p className="text-sm font-medium text-slate-900">{teamB || 'Equipo B'}</p>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Resultado (sets)</p>
          {sets.map((set, idx) => (
            <div key={idx}>
              <p className="mb-1 text-xs font-medium text-slate-500">Set {idx + 1}</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={0}
                  max={7}
                  value={set.a}
                  onChange={(e) => updateSet(idx, 'a', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-base font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="A"
                  disabled={isPending}
                />
                <input
                  type="number"
                  min={0}
                  max={7}
                  value={set.b}
                  onChange={(e) => updateSet(idx, 'b', e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-base font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="B"
                  disabled={isPending}
                />
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 text-xs font-semibold">
            {sets.length < 3 && (
              <button
                type="button"
                className="text-emerald-600 hover:text-emerald-700"
                onClick={addSet}
                disabled={isPending}
              >
                + Agregar set
              </button>
            )}
            {sets.length > 1 && (
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700"
                onClick={removeSet}
                disabled={isPending}
              >
                Quitar último set
              </button>
            )}
          </div>
        </div>

        <Input
          type="datetime-local"
          label="Fecha/hora jugado (opcional)"
          value={playedAt}
          onChange={(e) => setPlayedAt(e.target.value)}
          disabled={isPending}
        />

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={handleSubmit}
            loading={isPending}
            disabled={isPending}
          >
            Cargar resultado
          </Button>
        </div>
      </div>
    </Modal>
  );
}
