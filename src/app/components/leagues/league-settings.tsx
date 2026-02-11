'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import type { LeagueSettings as LeagueSettingsType, TieBreaker } from '@/types/leagues';

const TIE_BREAKER_LABELS: Record<TieBreaker, string> = {
  points: 'Puntos',
  wins: 'Victorias',
  set_difference: 'Diferencia de sets',
  game_difference: 'Diferencia de games',
};

const DEFAULT_SETTINGS: LeagueSettingsType = {
  scoring: { win: 3, draw: 1, loss: 0 },
  tieBreakers: ['points', 'wins', 'set_difference', 'game_difference'],
  includeSources: { reservation: true, manual: true },
};

interface LeagueSettingsProps {
  settings?: LeagueSettingsType;
  isReadOnly: boolean;
  onSave: (settings: LeagueSettingsType) => void;
  isSaving: boolean;
}

export function LeagueSettingsPanel({
  settings,
  isReadOnly,
  onSave,
  isSaving,
}: LeagueSettingsProps) {
  const base = settings ?? DEFAULT_SETTINGS;

  const [win, setWin] = useState(base.scoring.win);
  const [draw, setDraw] = useState(base.scoring.draw);
  const [loss, setLoss] = useState(base.scoring.loss);
  const [tieBreakers, setTieBreakers] = useState<TieBreaker[]>(base.tieBreakers);
  const [reservation, setReservation] = useState(base.includeSources.reservation);
  const [manual, setManual] = useState(base.includeSources.manual);

  // Sync when server data changes
  useEffect(() => {
    if (!settings) return;
    setWin(settings.scoring.win);
    setDraw(settings.scoring.draw);
    setLoss(settings.scoring.loss);
    setTieBreakers(settings.tieBreakers);
    setReservation(settings.includeSources.reservation);
    setManual(settings.includeSources.manual);
  }, [settings]);

  // Validation
  const isInteger = (v: number) => Number.isInteger(v);
  const scoringValid =
    isInteger(win) && isInteger(draw) && isInteger(loss) && win >= draw && draw >= loss;

  const scoringError = !scoringValid
    ? !isInteger(win) || !isInteger(draw) || !isInteger(loss)
      ? 'Los valores deben ser números enteros.'
      : 'Victoria ≥ Empate ≥ Derrota.'
    : '';

  const hasChanges =
    win !== base.scoring.win ||
    draw !== base.scoring.draw ||
    loss !== base.scoring.loss ||
    tieBreakers.join(',') !== base.tieBreakers.join(',') ||
    reservation !== base.includeSources.reservation ||
    manual !== base.includeSources.manual;

  const canSave = scoringValid && hasChanges && !isSaving;

  const moveTieBreaker = useCallback(
    (index: number, direction: 'up' | 'down') => {
      const next = [...tieBreakers];
      const swapIdx = direction === 'up' ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return;
      [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
      setTieBreakers(next);
    },
    [tieBreakers]
  );

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      scoring: { win, draw, loss },
      tieBreakers,
      includeSources: { reservation, manual },
    });
  };

  return (
    <div className="space-y-6">
      {/* Read-only banner */}
      {isReadOnly && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <Lock size={16} className="shrink-0 text-slate-400" />
          <p className="text-sm text-slate-600">
            Solo administradores pueden editar las reglas.
          </p>
        </div>
      )}

      {/* A) Scoring card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Puntuación</h3>
        <p className="text-xs text-slate-500 mb-4">Default 3–1–0</p>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="score-win" className="block text-xs font-medium text-slate-600 mb-1">
              Victoria
            </label>
            <input
              id="score-win"
              type="number"
              value={win}
              onChange={(e) => setWin(Number(e.target.value))}
              disabled={isReadOnly}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
          <div>
            <label htmlFor="score-draw" className="block text-xs font-medium text-slate-600 mb-1">
              Empate
            </label>
            <input
              id="score-draw"
              type="number"
              value={draw}
              onChange={(e) => setDraw(Number(e.target.value))}
              disabled={isReadOnly}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
          <div>
            <label htmlFor="score-loss" className="block text-xs font-medium text-slate-600 mb-1">
              Derrota
            </label>
            <input
              id="score-loss"
              type="number"
              value={loss}
              onChange={(e) => setLoss(Number(e.target.value))}
              disabled={isReadOnly}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
        </div>

        {scoringError && (
          <p className="mt-2 text-xs text-red-600">{scoringError}</p>
        )}
      </div>

      {/* B) Tie-breakers ordering */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Desempate</h3>
        <p className="text-xs text-slate-500 mb-4">
          Se usa para desempatar cuando hay igualdad de puntos
        </p>

        <div className="space-y-2">
          {tieBreakers.map((tb, idx) => (
            <div
              key={tb}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <span className="text-sm text-slate-700">
                {idx + 1}. {TIE_BREAKER_LABELS[tb]}
              </span>
              {!isReadOnly && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label={`Subir ${TIE_BREAKER_LABELS[tb]}`}
                    onClick={() => moveTieBreaker(idx, 'up')}
                    disabled={idx === 0}
                    className="rounded p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Bajar ${TIE_BREAKER_LABELS[tb]}`}
                    onClick={() => moveTieBreaker(idx, 'down')}
                    disabled={idx === tieBreakers.length - 1}
                    className="rounded p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* C) Include sources */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Fuentes de partidos</h3>
        <p className="text-xs text-slate-500 mb-4">
          Elegí qué partidos cuentan para la tabla
        </p>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-slate-700">Partidos cargados desde reserva</p>
              <p className="text-xs text-slate-400">Verificados automáticamente</p>
            </div>
            <input
              type="checkbox"
              checked={reservation}
              onChange={(e) => setReservation(e.target.checked)}
              disabled={isReadOnly}
              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm text-slate-700">Partidos cargados manualmente</p>
              <p className="text-xs text-slate-400">Requieren confirmación del rival</p>
            </div>
            <input
              type="checkbox"
              checked={manual}
              onChange={(e) => setManual(e.target.checked)}
              disabled={isReadOnly}
              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        </div>
      </div>

      {/* Save button */}
      {!isReadOnly && (
        <Button
          fullWidth
          size="lg"
          disabled={!canSave}
          onClick={handleSave}
          className="gap-2"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          Guardar ajustes
        </Button>
      )}
    </div>
  );
}
