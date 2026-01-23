'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Loader2,
  X,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { PlayerService } from '@/services/player-service';
import { useBookingStore } from '@/store/booking-store';
import { CreateHoldRequest } from '@/types';

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function BookingDrawer() {
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
    getHoldSecondsLeft,
  } = useBookingStore();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [now, setNow] = useState(() => Date.now());
  
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


  // ✅ countdown tick (sin setState cascada problemática)
  useEffect(() => {
    if (!isDrawerOpen || !hold?.expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [isDrawerOpen, hold?.expiresAt]);

  const secondsLeft = (() => {
    if (!hold?.expiresAt) return 0;
    const exp = new Date(hold.expiresAt).getTime();
    return Math.max(0, Math.floor((exp - now) / 1000));
  })();

  // form key: cambia si cambia el slot => remount form limpio
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

    try {
      const payload = {
        courtId: court.id,
        startAt: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          Number(selectedSlot.horaInicio.split(':')[0]),
          Number(selectedSlot.horaInicio.split(':')[1]),
          0,
          0
        ).toISOString(),
        endAt: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          Number(selectedSlot.horaFin.split(':')[0]),
          Number(selectedSlot.horaFin.split(':')[1]),
          0,
          0
        ).toISOString(),
        clienteNombre: nombre.trim(),
        clienteEmail: email.trim() ? email.trim() : undefined,
        clienteTelefono: telefono.trim() ? telefono.trim() : undefined,
        precio: resumen.precio,
      };

      const res = await PlayerService.createHold(payload as CreateHoldRequest);
      setHoldSuccess(res);
      toast.success('Turno retenido por 10 minutos ✅');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        (Array.isArray(e?.response?.data?.message)
          ? e.response.data.message.join(', ')
          : null) ||
        'No se pudo reservar. Probá otro horario.';
      setHoldError(String(msg));
      toast.error(String(msg));
    }
  };

  const onGoCheckout = () => {
    if (!hold?.id || !hold?.checkoutToken) return;
    window.location.href = `/checkout/${hold.id}?token=${encodeURIComponent(
      hold.checkoutToken
    )}`;
  };

  

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={closeDrawer}
      />

      {/* PANEL: bottom-sheet on mobile, centered modal on md+ */}
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full md:inset-0 md:flex md:items-center md:justify-center">
        <div
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

          {/* body (scrollable) */}
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

                {/* status blocks */}
                {holdState === 'held' && hold && (
                  <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 text-emerald-600" size={18} />
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

                {holdState === 'error' && holdError && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 text-amber-600" size={18} />
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
                    Tip: si ponés email, después podés ver tus reservas en “Mis turnos”.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* footer sticky (CTA siempre visible) */}
          <div className="border-t border-slate-100 bg-white px-5 py-4 md:px-6">
            <div className="grid gap-3 md:grid-cols-2">
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
