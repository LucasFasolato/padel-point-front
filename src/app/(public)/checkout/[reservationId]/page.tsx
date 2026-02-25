'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  CreditCard,
} from 'lucide-react';
import axios from 'axios';

import { PlayerService } from '@/services/player-service';
import type { CheckoutReservation } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { useHoldCountdown } from '@/hooks/use-hold-countdown';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

// =============================================================================
// TYPES
// =============================================================================

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

type IntentState = 'idle' | 'loading' | 'pending' | 'approved' | 'failed';

// =============================================================================
// HELPERS
// =============================================================================

const getApiErrorMessage = (error: unknown): string => {
  if (!axios.isAxiosError(error)) return '';
  const data = error.response?.data;
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (Array.isArray(data?.message)) return data.message.join(' ');
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.error === 'string') return data.error;
  return '';
};

const getErrorUserMessage = (error: unknown): string => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const message = getApiErrorMessage(error).toLowerCase();

  // Hold expirado
  if (status === 409 && message.includes('expired')) {
    return 'La reserva expiró. Elegí otro horario.';
  }

  // Reserva ya confirmada
  if (status === 409) {
    if (message.includes('already') || message.includes('confirmed')) {
      return 'Esta reserva ya fue confirmada. Revisá tu email o historial de reservas.';
    }
    return 'Hubo un conflicto con la reserva. Intentá de nuevo.';
  }

  // Token inválido o problema interno
  if (status === 400) {
    if (message.includes('token')) {
      return 'Hubo un problema con la sesión. Recargá la página e intentá de nuevo.';
    }
    return 'Datos inválidos. Verificá la información e intentá de nuevo.';
  }

  // Forbidden
  if (status === 403) {
    return 'No tenés permiso para realizar esta acción.';
  }

  // Not found
  if (status === 404) {
    return 'La reserva no fue encontrada. Es posible que haya expirado.';
  }

  // Network error
  if (!status) {
    return 'Error de conexión. Verificá tu internet e intentá de nuevo.';
  }

  return 'No pudimos procesar el pago. Intentá de nuevo.';
};

// =============================================================================
// COMPONENTS
// =============================================================================

function ProfileCard({
  profile,
  loading,
  error,
  onComplete,
}: {
  profile: PlayerProfile | null;
  loading: boolean;
  error: boolean;
  onComplete: () => void;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-2/3 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-1/3 rounded bg-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-xs text-amber-700">No pudimos cargar tus datos.</p>
      </div>
    );
  }

  if (!profile) return null;

  const isIncomplete = !profile.displayName || !profile.phone;

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Tus datos</h2>
        {isIncomplete && (
          <button
            type="button"
            onClick={onComplete}
            className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors"
          >
            Completar perfil
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <ProfileRow label="Email" value={profile.email} />
        <ProfileRow label="Nombre" value={profile.displayName} />
        <ProfileRow label="Teléfono" value={profile.phone} />
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${value ? 'text-slate-900' : 'text-slate-400 italic'}`}>
        {value || 'Sin completar'}
      </span>
    </div>
  );
}

function PaymentStatusCard({
  status,
  error,
}: {
  status: IntentState;
  error: string | null;
}) {
  const config = {
    idle: null,
    loading: {
      icon: <Loader2 className="h-6 w-6 animate-spin text-blue-600" />,
      title: 'Preparando el pago...',
      subtitle: 'Esto solo toma unos segundos.',
      className: 'border-blue-100 bg-blue-50',
    },
    pending: {
      icon: <Loader2 className="h-6 w-6 animate-spin text-blue-600" />,
      title: 'Procesando pago...',
      subtitle: 'No cierres esta ventana.',
      className: 'border-blue-100 bg-blue-50',
    },
    approved: {
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
      title: '¡Pago confirmado!',
      subtitle: 'Redirigiendo al comprobante...',
      className: 'border-emerald-100 bg-emerald-50',
    },
    failed: {
      icon: <XCircle className="h-6 w-6 text-rose-600" />,
      title: 'No pudimos procesar el pago',
      subtitle: error || 'Intentá de nuevo o elegí otro horario.',
      className: 'border-rose-100 bg-rose-50',
    },
  };

  const current = config[status];
  if (!current) return null;

  return (
    <div className={`rounded-2xl border p-5 text-center ${current.className}`}>
      <div className="flex flex-col items-center gap-3">
        {current.icon}
        <div>
          <p className="text-sm font-semibold text-slate-900">{current.title}</p>
          <p className="mt-0.5 text-xs text-slate-600">{current.subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function HoldExpiredOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2 text-white">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <span className="text-lg font-bold">Tiempo agotado</span>
        <span className="text-sm text-slate-300">La reserva expiró</span>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { reservationId } = useParams() as { reservationId: string };
  const checkoutToken = searchParams.get('token') ?? '';

  const user = useAuthStore((s) => s.user);
  const authToken = user?.userId ? 'session' : null;

  // State
  const [reservation, setReservation] = useState<CheckoutReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);

  const [intentState, setIntentState] = useState<IntentState>('idle');
  const [intentError, setIntentError] = useState<string | null>(null);
  const [currentIntent, setCurrentIntent] = useState<PaymentIntent | null>(null);

  // Refs for cleanup
  const abortRef = useRef<AbortController | null>(null);
  const profileAbortRef = useRef<AbortController | null>(null);
  const intentAbortRef = useRef<AbortController | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  // Derived
  const cacheKey = useMemo(() => `pp:checkout:${reservationId}`, [reservationId]);
  const clubUrl = reservation?.court?.club?.id ? `/club/${reservation.court.club.id}` : '/';

  // Countdown
  const countdownEnabled = reservation?.status === 'hold';
  const { mmss, expired, ready } = useHoldCountdown({
    expiresAtIso: reservation?.expiresAt ?? null,
    serverNowIso: reservation?.serverNow ?? null,
    enabled: countdownEnabled,
  });

  const isExpired = countdownEnabled && ready && expired;

  // ===========================================================================
  // FETCH RESERVATION
  // ===========================================================================

  useEffect(() => {
    if (!reservationId || !checkoutToken) {
      setLoadError('Link de checkout inválido.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    const fetchReservation = async () => {
      try {
        const data = await PlayerService.getCheckout(reservationId, checkoutToken);
        if (cancelled) return;

        setReservation(data);

        // Cache for page refresh
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}
      } catch {
        if (cancelled) return;
        setLoadError('Reserva no encontrada o link expirado.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchReservation();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [reservationId, checkoutToken, cacheKey]);

  // ===========================================================================
  // FETCH PROFILE (if authenticated)
  // ===========================================================================

  useEffect(() => {
    if (!authToken) {
      setProfile(null);
      return;
    }

    setProfileLoading(true);
    setProfileError(false);
    profileAbortRef.current?.abort();
    profileAbortRef.current = new AbortController();

    const fetchProfile = async () => {
      try {
        const res = await api.get<PlayerProfile>('/me/profile', {
          signal: profileAbortRef.current?.signal,
        });
        setProfile(res.data ?? null);
      } catch (err: unknown) {
        if (profileAbortRef.current?.signal.aborted) return;
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        if (status !== 401) setProfileError(true);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();

    return () => {
      profileAbortRef.current?.abort();
    };
  }, [authToken]);

  // ===========================================================================
  // PAYMENT FLOW
  // ===========================================================================

  const processPayment = useCallback(async () => {
    if (!reservationId || !checkoutToken) return;

    // ✅ Don't process if expired (use isExpired which checks ready)
    if (isExpired) {
      setIntentState('failed');
      setIntentError('La reserva expiró. Elegí otro horario.');
      return;
    }

    setIntentState('loading');
    setIntentError(null);

    intentAbortRef.current?.abort();
    intentAbortRef.current = new AbortController();

    try {
      // 1. Create payment intent
      const intentEndpoint = authToken ? '/payments/intents' : '/payments/public/intents';
      const { data: intent } = await api.post<PaymentIntent>(
        intentEndpoint,
        { reservationId, checkoutToken },
        { signal: intentAbortRef.current.signal },
      );

      if (!intent?.id) throw new Error('No se pudo crear el pago.');

      setCurrentIntent(intent);

      // Already approved (edge case: reservation was already confirmed)
      if (intent.status === 'approved' && intent.receiptToken) {
        setIntentState('approved');
        return;
      }

      // 2. Process payment (DEMO: simulate success)
      // TODO: Replace with real payment gateway (MercadoPago)
      setIntentState('pending');

      const { data: result } = await api.post<{ ok: boolean; intent: PaymentIntent }>(
        `/payments/public/intents/${intent.id}/simulate-success`,
        { checkoutToken },
        { signal: intentAbortRef.current.signal },
      );

      if (!result?.intent?.receiptToken) {
        throw new Error('El pago fue procesado pero no se generó el comprobante.');
      }

      setCurrentIntent(result.intent);
      setIntentState('approved');
    } catch (err) {
      if (intentAbortRef.current?.signal.aborted) return;
      setIntentState('failed');
      setIntentError(getErrorUserMessage(err));
    }
  }, [reservationId, checkoutToken, authToken, isExpired]);

  // ✅ Auto-start payment when reservation loads AND countdown is ready
  useEffect(() => {
    if (!reservation || loading || intentState !== 'idle') return;

    // ✅ Wait for countdown to be ready before deciding
    if (countdownEnabled && !ready) return;

    // ✅ Don't process if already expired
    if (isExpired) {
      setIntentState('failed');
      setIntentError('La reserva expiró. Elegí otro horario.');
      return;
    }

    // Only process if reservation is in valid state
    if (reservation.status === 'hold') {
      processPayment();
    }
  }, [reservation, loading, intentState, countdownEnabled, ready, isExpired, processPayment]);

  // Redirect on success
  useEffect(() => {
    if (intentState !== 'approved' || !currentIntent?.receiptToken) return;

    // Small delay for UX (show success state briefly)
    redirectTimeoutRef.current = window.setTimeout(() => {
      router.replace(
        `/checkout/success/${reservationId}?receiptToken=${encodeURIComponent(currentIntent.receiptToken!)}`,
      );
    }, 800);

    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [intentState, currentIntent, reservationId, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      profileAbortRef.current?.abort();
      intentAbortRef.current?.abort();
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  // ===========================================================================
  // RENDER
  // ===========================================================================

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500">Cargando checkout...</p>
      </div>
    );
  }

  // Error state
  if (loadError || !reservation) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <div className="rounded-full bg-rose-100 p-4">
          <XCircle className="h-8 w-8 text-rose-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-900">No pudimos cargar el checkout</p>
          <p className="mt-1 text-sm text-slate-500">{loadError}</p>
        </div>
        <button
          onClick={() => router.push('/')}
          className="mt-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <>
      <PublicTopBar backHref={clubUrl} title="Checkout" />

      <div className="min-h-[calc(100vh-56px)] bg-slate-50 px-4 py-8 pb-24">
        <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
          {/* Header with countdown */}
          <div className="relative overflow-hidden bg-slate-900 p-6 text-center text-white">
            {reservation.status === 'hold' ? (
              <>
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Tiempo restante para pagar
                </span>
                <div className="flex items-center justify-center gap-2 text-4xl font-bold tabular-nums tracking-tight">
                  <Clock className="text-blue-400" size={32} />
                  <span className={isExpired ? 'text-rose-400' : ''}>{mmss}</span>
                </div>
                {isExpired && <HoldExpiredOverlay />}
              </>
            ) : (
              <div className="py-2">
                <p className="text-sm text-slate-400">Estado de la reserva</p>
                <p className="mt-1 text-xl font-bold capitalize">{reservation.status}</p>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Profile card (if authenticated) */}
            {authToken && (
              <ProfileCard
                profile={profile}
                loading={profileLoading}
                error={profileError}
                onComplete={() => router.push('/me/profile')}
              />
            )}

            {/* Reservation details */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900">
                {reservation.court.nombre}
              </h1>
              <p className="mt-1 text-slate-500">
                {format(new Date(reservation.startAt), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-lg font-semibold text-slate-700">
                {format(new Date(reservation.startAt), 'HH:mm', { locale: es })} hs
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {reservation.court.club.nombre}
              </p>
            </div>

            {/* Price breakdown */}
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Cancha (1 hora)</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(reservation.precio)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Comisión de servicio</span>
                <span className="font-medium text-emerald-600">Gratis</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between">
                <span className="font-bold text-slate-900">Total a pagar</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(reservation.precio)}
                </span>
              </div>
            </div>

            {/* Payment status */}
            <PaymentStatusCard status={intentState} error={intentError} />

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Pago seguro y encriptado</span>
            </div>

            {/* Action buttons */}
            {intentState === 'failed' && !isExpired && (
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setIntentState('idle');
                    setIntentError(null);
                    processPayment();
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
                >
                  <CreditCard size={18} />
                  Reintentar pago
                </button>
                <button
                  type="button"
                  onClick={() => router.push(clubUrl)}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Elegir otro horario
                </button>
              </div>
            )}

            {isExpired && (
              <button
                type="button"
                onClick={() => router.push(clubUrl)}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Elegir otro horario
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
