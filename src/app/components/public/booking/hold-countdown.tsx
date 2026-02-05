import { motion, AnimatePresence } from 'framer-motion';
import { Timer, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import type { HoldReservationResponse } from '@/types';

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface HoldCountdownProps {
  holdState: 'idle' | 'creating' | 'held' | 'expired' | 'error';
  hold: HoldReservationResponse | null;
  holdError: string | null;
  isExpired: boolean;
  secondsLeft: number;
  onRetry: () => void;
}

export function HoldCountdown({
  holdState,
  hold,
  holdError,
  isExpired,
  secondsLeft,
  onRetry,
}: HoldCountdownProps) {
  return (
    <AnimatePresence mode="wait">
      {/* Expired */}
      {isExpired && (
        <motion.div
          key="expired"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
              <AlertTriangle className="text-rose-600" size={18} />
            </div>
            <div>
              <p className="font-semibold text-rose-900">El turno expiró</p>
              <p className="mt-0.5 text-sm text-rose-700/80">
                Elegí otro horario para continuar.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hold Active */}
      {holdState === 'held' && hold && !isExpired && (
        <motion.div
          key="held"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
                <CheckCircle2 className="text-emerald-600" size={18} />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">Turno retenido</p>
                <p className="mt-0.5 text-sm text-emerald-700/80">
                  Completá el pago antes de que expire.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-mono text-sm font-bold text-emerald-700 shadow-sm ring-1 ring-emerald-200">
              <Timer size={14} />
              {formatMMSS(secondsLeft)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Error */}
      {holdState === 'error' && holdError && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
              <AlertTriangle className="text-rose-600" size={18} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-rose-900">No pudimos reservar</p>
              <p className="mt-0.5 text-sm text-rose-700/80">{holdError}</p>
              <button
                onClick={onRetry}
                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-rose-700 hover:text-rose-800"
              >
                <RotateCcw size={14} />
                Intentar de nuevo
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
