'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Loader2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { PlayerService } from '@/services/player-service';
import type { CheckoutReservation } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { useHoldCountdown } from '@/hooks/use-hold-countdown';
import { saveReservationCache } from '@/lib/checkout-cache';
import api from '@/lib/api';

type PaymentIntentStatus = 'pending' | 'approved' | 'failed' | 'expired';

type PaymentIntent = {
  id: string;
  status: PaymentIntentStatus;
  receiptToken?: string | null;
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reservationId = (useParams() as { reservationId: string }).reservationId;

  // ✅ en checkout sigue viniendo el checkoutToken por query param "token"
  const token = searchParams.get('token') ?? '';

  const [reservation, setReservation] = useState<CheckoutReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [intentStatus, setIntentStatus] = useState<
    'idle' | 'loading' | 'pending' | 'failed' | 'timeout' | 'approved'
  >('idle');
  const [intentError, setIntentError] = useState<string | null>(null);
  const intentAbortRef = useRef<AbortController | null>(null);
  const pollingRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const pollingAbortRef = useRef<AbortController | null>(null);

  const cacheKey = useMemo(() => `pp:reservation:${reservationId}`, [reservationId]);

  useEffect(() => {
    let cancelled = false;
    const setSafe = (fn: () => void) => {
      if (!cancelled) fn();
    };

    const run = async () => {
      try {
        if (!reservationId || !token) throw new Error('missing token');

        const data = await PlayerService.getCheckout(reservationId, token);

        setSafe(() => setReservation(data));

        // cache para refresh / success
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}

        // cache “pro” (tu helper)
        try {
          saveReservationCache(reservationId, data);
        } catch {}
      } catch {
        setIntentError('Reserva no encontrada o token inválido.');
        setSafe(() => setReservation(null));
      } finally {
        setSafe(() => setLoading(false));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [reservationId, token, cacheKey]);

  // ✅ countdown usando serverNow (fuente de verdad)
  const countdownEnabled = reservation?.status === 'hold';

  const { mmss, expired, ready } = useHoldCountdown({
    expiresAtIso: reservation?.expiresAt ?? null,
    serverNowIso: reservation?.serverNow ?? null,
    enabled: countdownEnabled,
  });

  const createIntent = async () => {
    if (!reservationId || !token) return;

    if (ready && expired) {
      setIntentStatus('idle');
      setIntentError('El hold expiró. Volvé a elegir otro horario.');
      return;
    }

    setIntentStatus('loading');
    setIntentError(null);
    if (intentAbortRef.current) intentAbortRef.current.abort();
    intentAbortRef.current = new AbortController();

    try {
      const { data } = await api.post<PaymentIntent>(
        '/payments/intents',
        { reservationId, token },
        { signal: intentAbortRef.current.signal },
      );
      if (!data?.id) throw new Error('missing intent id');
      setIntent(data);
      if (data.status === 'approved') {
        setIntentStatus('approved');
      } else {
        setIntentStatus('pending');
        startPolling(data.id);
      }
    } catch {
      setIntentStatus('failed');
      setIntentError('No pudimos iniciar el pago. Intentá de nuevo.');
    }
  };

  const clearPolling = () => {
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    pollingRef.current = null;
    timeoutRef.current = null;
    if (pollingAbortRef.current) {
      pollingAbortRef.current.abort();
      pollingAbortRef.current = null;
    }
  };

  const startPolling = (intentId: string) => {
    clearPolling();

    const poll = async () => {
      if (!intentId) return;
      if (pollingAbortRef.current) pollingAbortRef.current.abort();
      pollingAbortRef.current = new AbortController();

      try {
        const { data } = await api.get<PaymentIntent>(
          `/payments/intents/${intentId}`,
          {
            params: { reservationId, token },
            signal: pollingAbortRef.current.signal,
          },
        );
        if (!data?.status) return;
        setIntent(data);
        if (data.status === 'approved') {
          setIntentStatus('approved');
          clearPolling();
        } else if (data.status === 'failed' || data.status === 'expired') {
          setIntentStatus('failed');
          clearPolling();
        } else {
          setIntentStatus('pending');
        }
      } catch {
        // ignore; timeout will handle slow connections
      }
    };

    poll();

    pollingRef.current = window.setInterval(poll, 2000);
    timeoutRef.current = window.setTimeout(() => {
      setIntentStatus('timeout');
      clearPolling();
    }, 35000);
  };

  useEffect(() => {
    if (!reservationId || !token) return;
    createIntent();
    return () => {
      clearPolling();
      if (intentAbortRef.current) intentAbortRef.current.abort();
    };
  }, [reservationId, token]);

  useEffect(() => {
    if (intentStatus !== 'approved') return;
    const receiptToken = intent?.receiptToken;
    if (!receiptToken) {
      setIntentStatus('failed');
      setIntentError('El pago fue aprobado pero faltan datos del comprobante.');
      return;
    }
    router.replace(
      `/checkout/success/${reservationId}?receiptToken=${encodeURIComponent(receiptToken)}`,
    );
  }, [intentStatus, intent, reservationId, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        {intentError ?? 'Reserva inválida'}
      </div>
    );
  }

  return (
    <>
      <PublicTopBar
        backHref={reservation?.court?.club?.id ? `/club/${reservation.court.club.id}` : '/'}
        title="Checkout"
      />

      <div className="min-h-[calc(100vh-56px)] bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
          {/* Header */}
          <div className="relative overflow-hidden bg-slate-900 p-6 text-center text-white">
            {reservation.status === 'hold' ? (
              <>
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Tiempo restante
                </span>

                <div className="flex items-center justify-center gap-2 text-4xl font-bold tabular-nums tracking-tight">
                  <Clock className="text-blue-400" size={32} />
                  {mmss}
                </div>

                {/* ✅ Overlay solo cuando el contador está ready */}
                {countdownEnabled && ready && expired && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
                    <span className="flex items-center gap-2 text-lg font-bold">
                      <AlertTriangle /> Tiempo agotado
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="py-2">
                <p className="text-sm text-slate-300">Estado</p>
                <p className="text-xl font-bold capitalize">{reservation.status}</p>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">
                  {reservation.court.nombre}
                </h1>

                <p className="text-slate-500">
                  {format(new Date(reservation.startAt), "EEEE d 'de' MMMM, HH:mm", {
                    locale: es,
                  })}{' '}
                  hs
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {reservation.court.club.nombre}
                </p>
              </div>

              <div className="space-y-3 border-y border-slate-100 py-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Precio</span>
                  <span className="font-medium text-slate-900">
                    {formatCurrency(reservation.precio)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Comisión</span>
                  <span className="font-medium text-slate-900">$0</span>
                </div>

                <div className="flex justify-between pt-2 text-lg font-bold">
                  <span className="text-slate-900">Total</span>
                  <span className="text-blue-600">
                    {formatCurrency(reservation.precio)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 py-2 text-xs text-slate-400">
                <ShieldCheck size={14} className="text-green-500" /> Pagos procesados de forma
                segura
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
                {intentStatus === 'loading' && (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Estamos preparando tu pago...
                      </p>
                      <p className="text-xs text-slate-500">
                        Esto puede tardar unos segundos.
                      </p>
                    </div>
                  </div>
                )}

                {intentStatus === 'pending' && (
                  <div className="flex flex-col items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span>Esperando confirmación del pago...</span>
                  </div>
                )}

                {intentStatus === 'approved' && (
                  <div className="flex flex-col items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Pago confirmado. Te redirigimos al comprobante...</span>
                  </div>
                )}

                {intentStatus === 'failed' && (
                  <div className="flex flex-col items-center gap-2 text-sm text-rose-600">
                    <XCircle className="h-5 w-5" />
                    <span>No pudimos confirmar el pago.</span>
                  </div>
                )}

                {intentStatus === 'timeout' && (
                  <div className="flex flex-col items-center gap-2 text-sm text-slate-600">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span>El pago está tardando más de lo esperado.</span>
                  </div>
                )}

                {(intentStatus === 'idle' || intentStatus === 'failed') && intentError && (
                  <div className="text-sm text-rose-600">
                    {intentError}
                  </div>
                )}
              </div>

              {(intentStatus === 'failed' || intentStatus === 'timeout') && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={createIntent}
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800"
                  >
                    Reintentar
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/club/${reservation.court.club.id}`)}
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Volver
                  </button>
                </div>
              )}

              {(ready && expired) && (
                <button
                  onClick={() => router.push(`/club/${reservation.court.club.id}`)}
                  className="w-full py-3 font-medium text-slate-500 hover:text-slate-800"
                >
                  Volver a intentar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
