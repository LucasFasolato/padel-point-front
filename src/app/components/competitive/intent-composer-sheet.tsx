'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { useCreateIntent } from '@/hooks/use-intents';
import type { IntentKind } from '@/services/intents-service';
import { cn } from '@/lib/utils';

// ── Config ────────────────────────────────────────────────────────────────────

type MatchMode = 'COMPETITIVE' | 'FRIENDLY';

const INTENT_OPTIONS: {
  type: IntentKind;
  icon: string;
  label: string;
  desc: string;
}[] = [
  { type: 'DIRECT', icon: '🎯', label: 'Directo', desc: '1v1 con rival' },
  { type: 'OPEN', icon: '🌐', label: 'Abierto', desc: 'Busco rival' },
  { type: 'FIND_PARTNER', icon: '🤝', label: 'Compañero', desc: 'Busco pareja' },
];

const EXPIRY_OPTIONS = [
  { label: '2h', value: 2 },
  { label: '6h', value: 6 },
  { label: '12h', value: 12 },
  { label: '24h', value: 24 },
  { label: '48h', value: 48 },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface IntentComposerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when 409 "already active" is returned — scroll to intents section */
  onViewExisting?: () => void;
  /** When set, the intent is scoped to this league (leagueId is sent with the payload) */
  leagueId?: string;
  /** Display name shown as context badge when leagueId is provided */
  leagueName?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IntentComposerSheet({
  isOpen,
  onClose,
  onViewExisting,
  leagueId,
  leagueName,
}: IntentComposerSheetProps) {
  const [intentType, setIntentType] = useState<IntentKind>('DIRECT');
  const [matchMode, setMatchMode] = useState<MatchMode>('COMPETITIVE');
  const [message, setMessage] = useState('');
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [alreadyActive, setAlreadyActive] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const createIntent = useCreateIntent();

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setIntentType('DIRECT');
      setMatchMode('COMPETITIVE');
      setMessage('');
      setExpiresInHours(24);
      setAlreadyActive(false);
      setBackendError(null);
    }
  }, [isOpen]);

  const showExpiry = intentType !== 'DIRECT';

  const handleCreate = async () => {
    setAlreadyActive(false);
    setBackendError(null);
    try {
      await createIntent.mutateAsync({
        type: intentType,
        matchType: matchMode,
        message: message.trim() || undefined,
        expiresInHours: showExpiry ? expiresInHours : undefined,
        leagueId: leagueId ?? undefined,
      });
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setAlreadyActive(true);
      } else {
        const msg = axios.isAxiosError(err)
          ? (err.response?.data?.message ?? 'No pudimos crear el desafío.')
          : 'No pudimos crear el desafío.';
        setBackendError(msg);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        aria-hidden
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal
        aria-label="Crear desafío"
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1.5 w-10 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Quiero jugar</h2>
            {leagueId && leagueName ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0E7C66]/10 px-2 py-0.5 text-[11px] font-semibold text-[#0E7C66]">
                🏆 {leagueName}
              </span>
            ) : (
              <p className="text-xs text-slate-500">Elegí cómo querés jugar</p>
            )}
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Intent type selector ── */}
        <div className="grid grid-cols-3 gap-2.5 px-5 pb-4">
          {INTENT_OPTIONS.map(({ type, icon, label, desc }) => {
            const active = intentType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setIntentType(type)}
                className={cn(
                  'flex min-h-[80px] flex-col items-center justify-center rounded-2xl border py-3 px-2 text-center transition-all active:scale-[0.97]',
                  active
                    ? 'border-[#0E7C66] bg-[#0E7C66]/8 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                )}
              >
                <span className="text-2xl leading-none">{icon}</span>
                <span
                  className={cn(
                    'mt-2 text-xs font-bold leading-none',
                    active ? 'text-[#0E7C66]' : 'text-slate-800'
                  )}
                >
                  {label}
                </span>
                <span className="mt-1 text-[10px] leading-none text-slate-400">{desc}</span>
              </button>
            );
          })}
        </div>

        <div className="mx-5 border-t border-slate-100" />

        {/* ── Config ── */}
        <div className="space-y-4 px-5 py-4">
          {/* Match mode toggle */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Modo
            </p>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              {(['COMPETITIVE', 'FRIENDLY'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMatchMode(mode)}
                  className={cn(
                    'flex-1 rounded-[10px] py-2 text-xs font-bold transition-all',
                    matchMode === mode
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-400'
                  )}
                >
                  {mode === 'COMPETITIVE' ? 'Competitivo' : 'Amistoso'}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label
              htmlFor="intent-message"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400"
            >
              Mensaje (opcional)
            </label>
            <textarea
              id="intent-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ej: Busco partido mañana a la tarde..."
              rows={2}
              maxLength={200}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-[#0E7C66] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0E7C66]"
            />
          </div>

          {/* Expiration (only for Open + FindPartner) */}
          {showExpiry && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Expira en
              </p>
              <div className="flex gap-2">
                {EXPIRY_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setExpiresInHours(value)}
                    className={cn(
                      'flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors',
                      expiresInHours === value
                        ? 'border-[#0E7C66] bg-[#0E7C66] text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Error banners ── */}
        {alreadyActive && (
          <div className="mx-5 mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-900">
              Ya tenés un desafío activo
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Cancelá el anterior antes de crear uno nuevo.
            </p>
            {onViewExisting && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewExisting();
                }}
                className="mt-2 text-xs font-bold text-[#0E7C66] underline-offset-2 hover:underline"
              >
                Ver mi desafío →
              </button>
            )}
          </div>
        )}

        {backendError && (
          <div className="mx-5 mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm text-rose-700">{backendError}</p>
          </div>
        )}

        {/* ── Primary CTA ── */}
        <div className="px-5 pb-6">
          <button
            type="button"
            onClick={handleCreate}
            disabled={createIntent.isPending}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[#0E7C66] text-base font-bold text-white transition-colors hover:bg-[#0B6B58] disabled:opacity-60 active:scale-[0.98]"
          >
            {createIntent.isPending ? 'Creando...' : 'Crear'}
          </button>
        </div>
      </div>
    </>
  );
}
