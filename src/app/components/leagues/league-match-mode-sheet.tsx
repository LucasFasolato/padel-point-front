'use client';

import { useEffect } from 'react';
import { CalendarClock, Trophy, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface LeagueMatchModeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayed: () => void;
  onScheduled: () => void;
}

export function LeagueMatchModeSheet({
  isOpen,
  onClose,
  onPlayed,
  onScheduled,
}: LeagueMatchModeSheetProps) {
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar selector de partido"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
      />

      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Cargar partido</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onPlayed}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Partido ya jugado</p>
              <p className="text-xs text-slate-500">Cargá jugadores y resultado ahora</p>
            </div>
            <Trophy size={18} className="text-emerald-600" />
          </button>

          <button
            type="button"
            onClick={onScheduled}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Partido por jugar</p>
              <p className="text-xs text-slate-500">Guardá jugadores y cargá resultado después</p>
            </div>
            <CalendarClock size={18} className="text-blue-600" />
          </button>
        </div>

        <Button fullWidth variant="outline" className="mt-3" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
