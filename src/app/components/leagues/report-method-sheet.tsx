'use client';

import { useEffect } from 'react';
import { CalendarCheck2, PencilLine, X } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface ReportMethodSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onReservation: () => void;
  onManual: () => void;
}

export function ReportMethodSheet({
  isOpen,
  onClose,
  onReservation,
  onManual,
}: ReportMethodSheetProps) {
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
        aria-label="Cerrar selector de carga"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
      />

      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl ring-1 ring-black/5">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Cargar resultado</h3>
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
            onClick={onReservation}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Desde una reserva</p>
              <p className="text-xs text-slate-500">Partido verificado automaticamente</p>
            </div>
            <CalendarCheck2 size={18} className="text-emerald-600" />
          </button>

          <button
            type="button"
            onClick={onManual}
            className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition-colors hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900">Cargar manualmente</p>
              <p className="text-xs text-slate-500">El rival debe confirmar o disputar</p>
            </div>
            <PencilLine size={18} className="text-slate-600" />
          </button>
        </div>

        <Button fullWidth variant="outline" className="mt-3" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
