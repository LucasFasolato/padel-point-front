'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { toastManager } from '@/lib/toast';
import {
  Loader2,
  X,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useHoldCountdown } from '@/hooks/use-hold-countdown';
import { PlayerService } from '@/services/player-service';
import { useBookingStore } from '@/store/booking-store';
import type { CreateHoldRequest } from '@/types';
import { useRouter } from 'next/navigation';

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildIsoForDayAndTime(day: Date, hhmm: string) {
  const [hh, mm] = hhmm.split(':').map((n) => Number(n));
  const dt = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    Number.isFinite(hh) ? hh : 0,
    Number.isFinite(mm) ? mm : 0,
    0,
    0
  );
  return dt.toISOString();
}

export function BookingDrawer() {

  const router = useRouter();
  const {
    isDrawerOpen,
    closeDrawer,
    club,
    court,
    selectedDate,
    selectedSlot,

    hold,
    holdState,
    holdError,
    setHoldCreating,
    setHoldSuccess,
    setHoldError,
  } = useBookingStore();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  const holdAbortRef = useRef<AbortController | null>(null);
  const expireToastKeyRef = useRef<string | null>(null);
  const hasExpiredRef = useRef(false);

  const resetLocalState = () => {
    setNombre('');
    setEmail('');
    setTelefono('');
    if (holdAbortRef.current) {
      holdAbortRef.current.abort();
      holdAbortRef.current = null;
    }
  };

  const resumen = useMemo(() => {
    if (!club || !court || !selectedSlot) return null;
    return {
      club: club.nombre,
      court: court.nombre,
      dateLabel: format(selectedDate, 'EEEE dd/MM'),
      start: selectedSlot.horaInicio,
      end: selectedSlot.horaFin,
      precio: court.precioPorHora,
    };
  }, [club, court, selectedDate, selectedSlot]);

  useEffect(() => {
    console.log('[HOLD][STORE]', { holdState, hold });
  }, [holdState, hold]);
  
  // ESC + scroll lock (solo si está abierto)
  useEffect(() => {
    if (!isDrawerOpen) return;

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') closeDrawer();
    };

    const previousOverflow = document.body.style.overflow;

    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen, closeDrawer]);

  useEffect(() => {
    if (isDrawerOpen) {
      expireToastKeyRef.current = `hold-expired-${Date.now()}`;
      hasExpiredRef.current = false;
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) {
      resetLocalState();
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    return () => {
      resetLocalState();
    };
  }, []);

  const countdownEnabled = isDrawerOpen && holdState === 'held';

  const { timeLeftSec, expired } = useHoldCountdown({
    expiresAtIso: hold?.expiresAt ?? null,
    serverNowIso: hold?.serverNow ?? null,
    enabled: countdownEnabled,
    onExpire: () => {
      if (!isDrawerOpen || hasExpiredRef.current) return;
      hasExpiredRef.current = true;
      if (holdAbortRef.current) {
        holdAbortRef.current.abort();
        holdAbortRef.current = null;
      }
      toastManager.error('La reserva expiro. Volve a intentarlo.', {
        idempotencyKey: expireToastKeyRef.current ?? 'hold-expired',
      });
    },
  });

  const secondsLeft = timeLeftSec ?? 0;
  const isExpired = countdownEnabled && expired;

  const canGoCheckout =
    holdState === 'held' && !!hold?.id && !!hold?.checkoutToken && !isExpired;

  // form key: cambia si cambia slot => inputs limpios sin useEffect reseteando state
  const formKey = useMemo(() => {
    if (!selectedSlot || !court) return 'empty';
    return `${court.id}-${selectedSlot.fecha}-${selectedSlot.horaInicio}-${selectedSlot.horaFin}`;
  }, [selectedSlot, court]);

  if (!isDrawerOpen) return null;

  const nombreOk = nombre.trim().length >= 2;

  const canSubmit =
    !!resumen && holdState !== 'creating' && holdState !== 'held' && nombreOk;

  const onCreateHold = async () => {
    if (!resumen || !court || !selectedSlot) return;

    setHoldCreating();
    if (holdAbortRef.current) {
      holdAbortRef.current.abort();
    }
    const controller = new AbortController();
    holdAbortRef.current = controller;

    try {
      const payload: CreateHoldRequest = {
        courtId: court.id,
        startAt: buildIsoForDayAndTime(selectedDate, selectedSlot.horaInicio),
        endAt: buildIsoForDayAndTime(selectedDate, selectedSlot.horaFin),
        clienteNombre: nombre.trim(),
        clienteEmail: email.trim() ? email.trim() : undefined,
        clienteTelefono: telefono.trim() ? telefono.trim() : undefined,
        precio: resumen.precio,
      };
      console.log('[HOLD][CLICK] resumen/court/slot', { resumen, court, selectedSlot });
      console.log('[HOLD][PAYLOAD]', payload);
      const res = await PlayerService.createHold(payload, controller.signal);
      console.log('[HOLD][API_OK]', res);
      setHoldSuccess(res);

      // window.location.href = `/checkout/${res.id}?token=${encodeURIComponent(res.checkoutToken)}`;
      router.push(`/checkout/${res.id}?token=${encodeURIComponent(res.checkoutToken)}`);
      toastManager.success('Turno retenido por 10 minutos.');
    } catch (err: unknown) {
      const canceled =
        controller.signal.aborted ||
        (typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code?: string }).code === 'ERR_CANCELED');

      if (canceled) return;

      // sin any: extraemos mensaje de forma segura
      const e = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };

      const raw = e?.response?.data?.message;
      const msg =
        typeof raw === 'string'
          ? raw
          : Array.isArray(raw)
          ? raw.join(', ')
          : e?.message || 'No se pudo reservar. Probá otro horario.';

      setHoldError(String(msg));
      toastManager.error(String(msg));
    } finally {
      if (holdAbortRef.current === controller) {
        holdAbortRef.current = null;
      }
    }
  };

  const onGoCheckout = () => {
    if (isExpired) {
      toastManager.error('El hold expiro. Elegi otro horario.');
      return;
    }
    if (!hold?.id || !hold.checkoutToken) return;
    // window.location.href = `/checkout/${hold.id}?token=${encodeURIComponent(hold.checkoutToken)}`;
    router.push(`/checkout/${hold.id}?token=${encodeURIComponent(hold.checkoutToken)}`);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={closeDrawer}
      />

      {/* PANEL */}
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full md:inset-0 md:flex md:items-center md:justify-center">
        <div onClick={(e) => e.stopPropagation()}
          className={cn(
            'w-full bg-white shadow-2xl ring-1 ring-black/10',
            'rounded-t-3xl md:rounded-3xl',
            'md:max-w-3xl',
            'max-h-[90vh] md:max-h-[80vh]',
            'flex flex-col'
          )}
        >
          {/* grab handle (mobile) */}
          <div className="md:hidden flex justify-center pt-3">
            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
          </div>

          {/* header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 md:px-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Reserva
              </p>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Confirmá tu turno
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Lo retenemos 10 minutos para que nadie más lo tome.
              </p>
            </div>

            <button
              onClick={closeDrawer}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* body */}
          <div className="flex-1 overflow-auto px-5 py-5 md:px-6">
            <div className="grid gap-5 md:grid-cols-2">
              {/* Summary */}
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  {resumen ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {resumen.club}
                        </p>
                        <p className="text-sm text-slate-600">{resumen.court}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100">
                          <p className="text-[11px] font-semibold text-slate-500">
                            Día
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {resumen.dateLabel}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100">
                          <p className="text-[11px] font-semibold text-slate-500">
                            Horario
                          </p>
                          <p className="text-sm font-semibold text-slate-900">
                            {resumen.start} – {resumen.end}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 ring-1 ring-slate-100">
                        <p className="text-[11px] font-semibold text-slate-500">
                          Total
                        </p>
                        <p className="text-base font-extrabold text-slate-900">
                          $ {resumen.precio.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Elegí un horario para continuar.
                    </p>
                  )}
                </div>

                {/* Expirado */}
                {isExpired && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 text-rose-600" size={18} />
                      <div>
                        <p className="text-sm font-semibold text-rose-900">
                          El turno expiró
                        </p>
                        <p className="text-xs text-rose-800/80">
                          Elegí otro horario para continuar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hold activo */}
                {holdState === 'held' && hold && !isExpired && (
                  <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2
                        className="mt-0.5 text-emerald-600"
                        size={18}
                      />
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          Hold activo
                        </p>
                        <p className="text-xs text-emerald-800/80">
                          Te queda tiempo para confirmar.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-emerald-900 ring-1 ring-emerald-200">
                      <Timer size={14} className="text-emerald-700" />
                      {formatMMSS(secondsLeft)}
                    </div>
                  </div>
                )}

                {/* Error */}
                {holdState === 'error' && holdError && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className="mt-0.5 text-amber-600"
                        size={18}
                      />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          No se pudo reservar
                        </p>
                        <p className="text-xs text-amber-800/80">{holdError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form */}
              <div key={formKey} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Nombre <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Lucas"
                    className={cn(
                      'mt-1 h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 outline-none',
                      nombreOk
                        ? 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                        : 'border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                    )}
                  />
                  {!nombreOk && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      Mínimo 2 caracteres.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Email <span className="text-slate-400">(opcional)</span>
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@mail.com"
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Teléfono <span className="text-slate-400">(opcional)</span>
                  </label>
                  <input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+54 9 ..."
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                  <p className="text-xs text-slate-500">
                    Tip: si ponés email, después podés ver tus reservas en “Mis
                    turnos”.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="border-t border-slate-100 bg-white px-5 py-4 md:px-6">
            <div className="grid gap-3 md:grid-cols-2">
              {/* CTA principal */}
              {holdState !== 'held' ? (
                <button
                  disabled={!canSubmit}
                  onClick={onCreateHold}
                  className={cn(
                    'flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition',
                    canSubmit
                      ? 'bg-slate-900 text-white hover:bg-blue-600'
                      : 'cursor-not-allowed bg-slate-200 text-slate-500'
                  )}
                >
                  {holdState === 'creating' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Reteniendo...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      Retener turno (10 min)
                    </>
                  )}
                </button>
              ) : isExpired ? (
                <button
                  onClick={closeDrawer}
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Elegir otro horario
                </button>
              ) : (
                <button
                  onClick={onGoCheckout}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Continuar (checkout)
                </button>
              )}

              <button
                onClick={closeDrawer}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>

            <p className="mt-3 text-[11px] text-slate-400">
              Al retener el turno, queda bloqueado temporalmente para vos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
