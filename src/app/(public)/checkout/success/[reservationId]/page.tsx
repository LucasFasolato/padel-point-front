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
import axios from 'axios';

import { PlayerService } from '@/services/player-service';
import type { CheckoutReservation } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { useHoldCountdown } from '@/hooks/use-hold-countdown';
import { saveReservationCache } from '@/lib/checkout-cache';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

type PlayerProfile = {
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
};

type PaymentIntentStatus = 'pending' | 'approved' | 'failed' | 'expired';

type PaymentIntent = {
  id: string;
  status: PaymentIntentStatus;
  receiptToken?: string | null;
};

type SimulateResult = {
  ok: boolean;
  intent: PaymentIntent;
};

const getApiErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) return '';
  const data = error.response?.data;
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (Array.isArray((data as { message?: string[] }).message)) {
    return (data as { message?: string[] }).message?.join(' ') ?? '';
  }
  if (typeof (data as { message?: string }).message === 'string') {
    return (data as { message?: string }).message ?? '';
  }
  if (typeof (data as { error?: string }).error === 'string') {
    return (data as { error?: string }).error ?? '';
  }
  return '';
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reservationId = (useParams() as { reservationId: string }).reservationId;

  // ✅ en checkout sigue viniendo el checkoutToken por query param "token"
  const token = searchParams.get('token') ?? '';

  const { token: authToken } = useAuthStore();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const profileAbortRef = useRef<AbortController | null>(null);

  const [reservation, setReservation] = useState<CheckoutReservation | null>(null);
  const [loading, setLoading] = useState(true);

  const [intent, setIntent] = useState<PaymentIntent | null>(null);
  const [intentStatus, setIntentStatus] = useState<
    'idle' | 'loading' | 'pending' | 'failed' | 'timeout' | 'approved'
  >('idle');
  const [intentError, setIntentError] = useState<string | null>(null);

  const intentAbortRef = useRef<AbortController | null>(null);

  const cacheKey = useMemo(() => `pp:reservation:${reservationId}`, [reservationId]);

  // -------------------------
  // Perfil (si logueado)
  // -------------------------
  useEffect(() => {
    if (!authToken) {
      setProfile(null);
      setProfileError(false);
      return;
    }

    setProfileLoading(true);
    setProfileError(false);
    if (profileAbortRef.current) profileAbortRef.current.abort();
    profileAbortRef.current = new AbortController();

    const run = async () => {
      try {
        const res = await api.get<PlayerProfile>('/me/profile', {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: profileAbortRef.current?.signal,
        });
        setProfile(res.data ?? null);
      } catch (err: unknown) {
        if (profileAbortRef.current?.signal.aborted) return;
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const status = (err as { response?: { status?: number } }).response?.status;
          if (status === 401) {
            setProfile(null);
            return;
          }
        }
        setProfileError(true);
      } finally {
        setProfileLoading(false);
      }
    };

    run();

    return () => {
      if (profileAbortRef.current) profileAbortRef.current.abort();
    };
  }, [authToken]);

  // -------------------------
  // Cargar checkout (reserva)
  // -------------------------
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

  // -------------------------
  // ✅ NUEVO: confirmar intent una sola vez (sin polling)
  // -------------------------
  const confirmIntent = async (intentId: string) => {
    if (!intentId) throw new Error('missing intent id');

    const simulateEndpoint = authToken
      ? `/payments/intents/${intentId}/simulate-success`
      : `/payments/public/intents/${intentId}/simulate-success`;

    const { data } = await api.post<SimulateResult>(
      simulateEndpoint,
      { checkoutToken: token },
      { signal: intentAbortRef.current?.signal },
    );

    const nextIntent = data?.intent;
    if (!nextIntent) throw new Error('missing intent');

    setIntent(nextIntent);

    const receiptToken = nextIntent.receiptToken;
    if (!receiptToken) {
      // Si el backend confirmó pero no devolvió receiptToken -> error claro
      setIntentStatus('failed');
      setIntentError('El pago fue aprobado pero faltan datos del comprobante.');
      return;
    }

    setIntentStatus('approved');
    router.replace(
      `/checkout/success/${reservationId}?receiptToken=${encodeURIComponent(receiptToken)}`,
    );
  };

  // -------------------------
  // Crear intent + confirmar (sin polling)
  // -------------------------
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
      const intentEndpoint = authToken ? '/payments/intents' : '/payments/public/intents';

      const { data } = await api.post<PaymentIntent>(
        intentEndpoint,
        { reservationId, checkoutToken: token },
        { signal: intentAbortRef.current.signal },
      );

      if (!data?.id) throw new Error('missing intent id');

      setIntent(data);

      // Mostramos “esperando confirmación…” mientras confirmamos
      setIntentStatus('pending');

      // ✅ SIN POLLING: confirmo una vez y redirijo por receiptToken
      await confirmIntent(data.id);
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const message = getApiErrorMessage(error).toLowerCase();

      // Caso: la reserva ya está confirmada (409)
      if (status === 409 && message.includes('already') && message.includes('confirmed')) {
        setIntentStatus('failed');
        setIntentError(
          'Esta reserva ya está confirmada. Si necesitás el comprobante, usá el link del receiptToken.',
        );
        return;
      }

      if (status === 400 && message.includes('token') && message.includes('should not exist')) {
        setIntentError('Ocurrió un problema interno al iniciar el pago. Actualizá la página o reintentá.');
      } else {
        setIntentError('No pudimos iniciar el pago. Intentá de nuevo.');
      }
      setIntentStatus('failed');
    }
  };

  // Auto-run al entrar
  useEffect(() => {
    if (!reservationId || !token) return;
    createIntent();
    return () => {
      if (intentAbortRef.current) intentAbortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId, token]);

  // -------------------------
  // UI
  // -------------------------
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
              {authToken && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Tus datos</h2>
                    {profile && (!profile.displayName || !profile.phone) && (
                      <button
                        type="button"
                        onClick={() => router.push('/me/profile')}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-500"
                      >
                        Completar perfil
                      </button>
                    )}
                  </div>

                  {profileLoading ? (
                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-2/3 rounded bg-slate-200 animate-pulse" />
                      <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
                      <div className="h-4 w-1/3 rounded bg-slate-200 animate-pulse" />
                    </div>
                  ) : profile ? (
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Email</span>
                        <span className="font-medium text-slate-900">
                          {profile.email || 'Falta completar'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Nombre</span>
                        <span className="font-medium text-slate-900">
                          {profile.displayName || 'Falta completar'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Teléfono</span>
                        <span className="font-medium text-slate-900">
                          {profile.phone || 'Falta completar'}
                        </span>
                      </div>
                    </div>
                  ) : profileError ? (
                    <p className="mt-3 text-xs text-slate-400">No pudimos cargar tus datos.</p>
                  ) : null}
                </div>
              )}

              <div className="text-center">
                <h1 className="text-2xl font-bold text-slate-900">{reservation.court.nombre}</h1>

                <p className="text-slate-500">
                  {format(new Date(reservation.startAt), "EEEE d 'de' MMMM, HH:mm", {
                    locale: es,
                  })}{' '}
                  hs
                </p>

                <p className="mt-1 text-sm text-slate-400">{reservation.court.club.nombre}</p>
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
                  <span className="text-blue-600">{formatCurrency(reservation.precio)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 py-2 text-xs text-slate-400">
                <ShieldCheck size={14} className="text-green-500" /> Pagos procesados de forma segura
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
                {intentStatus === 'loading' && (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Estamos preparando tu pago...
                      </p>
                      <p className="text-xs text-slate-500">Esto puede tardar unos segundos.</p>
                    </div>
                  </div>
                )}

                {intentStatus === 'pending' && (
                  <div className="flex flex-col items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div className="text-center">
                      <p>Esperando confirmación del pago...</p>
                      <p className="text-xs text-slate-500">No cierres esta ventana.</p>
                    </div>
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
                  <div className="text-sm text-rose-600">{intentError}</div>
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

              {ready && expired && (
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
