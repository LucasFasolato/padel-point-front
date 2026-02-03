'use client';

import { useEffect, useMemo, useState, Suspense, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Home,
  Loader2,
  AlertTriangle,
  ExternalLink,
  CreditCard,
  User,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { PlayerService } from '@/services/player-service';
import type { CheckoutReservation } from '@/types';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { ReservationNotificationCard } from '@/app/components/public/reservation-notification-card';
import { useReservationNotifications } from '@/hooks/use-reservation-notifications';
import { showMessageToast, showSuccessToast } from '@/lib/toast';
import { formatCurrency } from '@/lib/utils';

function ReceiptSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 animate-pulse space-y-6">
        <div className="h-6 w-32 rounded-full bg-slate-200" />
        <div className="h-16 w-16 rounded-full bg-slate-200" />
        <div className="space-y-2">
          <div className="h-5 w-2/3 rounded-full bg-slate-200" />
          <div className="h-4 w-1/2 rounded-full bg-slate-200" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="h-24 w-full rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

const shortId = (value: string) => value.slice(-6).toUpperCase();

function ErrorState({
  title,
  description,
  actionLabel = 'Volver al inicio',
  actionHref = '/',
  onRetry,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicTopBar backHref="/" title="Comprobante" />
      <div className="flex h-[70vh] items-center justify-center px-4 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
          <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={28} />
          </div>

          <p className="text-xl font-extrabold text-slate-900">{title}</p>
          <p className="mt-2 text-sm text-slate-500">
            {description}
          </p>

          <div className="mt-6 space-y-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                Reintentar
              </button>
            )}
            <Link
              href={actionHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Home size={16} /> {actionLabel}
            </Link>

            <button
              type="button"
              onClick={() => {
                showMessageToast(
                  'Tip: entrá desde el link del comprobante (receiptToken) o volvé a reservar.',
                );
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              <ExternalLink size={16} /> Entendido
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Si venís desde el checkout, asegurate de abrir el link con{' '}
            <span className="font-semibold">receiptToken</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SuccessContent({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ token correcto: receiptToken. Fallback por compatibilidad: token
  const receiptToken =
    searchParams.get('receiptToken') ?? searchParams.get('token') ?? '';

  const [reservation, setReservation] = useState<CheckoutReservation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [missingReceiptToken, setMissingReceiptToken] = useState(false);
  const [receiptError, setReceiptError] = useState<'invalid' | 'notfound' | 'error' | null>(null);

  const cacheKey = useMemo(() => `pp:receipt:${reservationId}`, [reservationId]);

  useEffect(() => {
    if (!reservationId) return;

    let cancelled = false;
    let cleanupTimer: number | null = null;

    const setSafe = (fn: () => void) => {
      if (!cancelled) fn();
    };

    const hasToken = Boolean(receiptToken);
    if (!hasToken) {
      setSafe(() => setMissingReceiptToken(true));
    }

    const readCache = (): CheckoutReservation | null => {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (!raw) return null;
        return JSON.parse(raw) as CheckoutReservation;
      } catch {
        return null;
      }
    };

    const writeCache = (data: CheckoutReservation) => {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {}
    };

    const scheduleCleanup = () => {
      // limpieza suave (10 min) para no dejar basura eterna
      cleanupTimer = window.setTimeout(() => {
        try {
          sessionStorage.removeItem(cacheKey);
        } catch {}
      }, 10 * 60 * 1000);
    };

    // 1) Cache-first
    const cached = readCache();
    if (cached) {
      setSafe(() => {
        setReservation(cached);
        setLoading(false);
      });
      scheduleCleanup();

      // 1b) Revalidación silenciosa si hay receiptToken (actualiza datos sin “flash”)
      if (hasToken) {
        (async () => {
          try {
            const fresh = await PlayerService.getReceipt(
              reservationId,
              receiptToken,
            );
            writeCache(fresh);
            setSafe(() => setReservation(fresh));
        } catch (err: unknown) {
          if (typeof err === 'object' && err !== null && 'response' in err) {
            const status = (err as { response?: { status?: number } }).response?.status;
            if (status === 401 || status === 403) {
              setSafe(() => setReceiptError('invalid'));
            } else if (status === 404) {
              setSafe(() => setReceiptError('notfound'));
            }
          }
        }
      })();
    }

      return () => {
        cancelled = true;
        if (cleanupTimer) window.clearTimeout(cleanupTimer);
      };
    }

    // 2) Sin cache -> fetch receipt
    const fetchReceipt = async () => {
      try {
        if (!receiptToken) throw new Error('missing receiptToken');

        const data = await PlayerService.getReceipt(reservationId, receiptToken);

        writeCache(data);
        setSafe(() => setReservation(data));
        scheduleCleanup();
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const status = (err as { response?: { status?: number } }).response?.status;
          if (status === 401 || status === 403) {
            setSafe(() => setReceiptError('invalid'));
          } else if (status === 404) {
            setSafe(() => setReceiptError('notfound'));
          } else {
            setSafe(() => setReceiptError('error'));
          }
        } else {
          setSafe(() => setReceiptError('error'));
        }
        setSafe(() => setReservation(null));
      } finally {
        setSafe(() => setLoading(false));
      }
    };

    if (hasToken) {
      fetchReceipt();
    } else {
      setSafe(() => setLoading(false));
    }

    return () => {
      cancelled = true;
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
    };
  }, [reservationId, receiptToken, cacheKey]);

  const {
    notification,
    loading: notificationLoading,
    error: notificationError,
    resend,
    canResend,
    isResending,
  } = useReservationNotifications({
    reservationId,
    receiptToken,
    enabled: Boolean(reservation),
  });

  if (loading) {
    return <ReceiptSkeleton />;
  }

  if (!reservation) {
    if (missingReceiptToken) {
      return (
        <ErrorState
          title="Falta un dato del comprobante"
          description="Falta un dato del comprobante. Volvé a abrir el link desde el checkout."
        />
      );
    }
    if (receiptError === 'invalid') {
      return (
        <ErrorState
          title="El link del comprobante no es válido"
          description="El link del comprobante no es válido o expiró."
        />
      );
    }
    if (receiptError === 'notfound') {
      return (
        <ErrorState
          title="No encontramos tu comprobante"
          description="No encontramos tu comprobante."
        />
      );
    }
    return (
      <ErrorState
        title="No pudimos cargar tu comprobante"
        description="Tuvimos un problema cargando el comprobante. Reintentá."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const clubId = reservation.court.club.id;
  const summaryText = [
    'Comprobante PadelPoint',
    `Reserva #${shortId(reservation.id)}`,
    `Club: ${reservation.court.club.nombre}`,
    `Cancha: ${reservation.court.nombre}`,
    `Fecha: ${format(parseISO(reservation.startAt), 'EEEE d MMMM', { locale: es })}`,
    `Horario: ${format(parseISO(reservation.startAt), 'HH:mm')} - ${format(parseISO(reservation.endAt), 'HH:mm')} hs`,
    `Total: ${formatCurrency(reservation.precio)}`,
  ].join('\n');

  return (
    <>
      <PublicTopBar backHref={`/club/${clubId}`} title="Comprobante" />

      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-slate-100 p-8 space-y-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 size={14} /> Pago confirmado
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Reserva #{shortId(reservation.id)}
            </span>
          </div>

          <div className="text-left">
            <h1 className="text-2xl font-bold text-slate-900">
              Comprobante de reserva
            </h1>
            <p className="text-sm text-slate-500">
              Guardá este comprobante. El link dura 14 días.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Club
                </p>
                <p className="font-bold text-slate-900">
                  {reservation.court.club.nombre}
                </p>
                {reservation.court.club.direccion && (
                  <p className="text-sm text-slate-500">
                    {reservation.court.club.direccion}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Fecha
                </p>
                <p className="font-bold text-slate-900 capitalize">
                  {format(parseISO(reservation.startAt), 'EEEE d MMMM', {
                    locale: es,
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">
                  Horario
                </p>
                <p className="font-bold text-slate-900">
                  {format(parseISO(reservation.startAt), 'HH:mm')} –{' '}
                  {format(parseISO(reservation.endAt), 'HH:mm')} hs
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-400 uppercase font-bold">
                Cancha
              </p>
              <p className="font-bold text-slate-900">
                {reservation.court.nombre}
              </p>
              <p className="text-sm text-slate-500">
                {reservation.court.superficie}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <CreditCard size={16} /> Pago
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Estado</span>
              <span className="font-semibold text-emerald-700">Confirmado</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Total</span>
              <span className="text-base font-bold text-slate-900">
                {formatCurrency(reservation.precio)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
              <User size={16} /> Cliente
            </div>
            <div className="text-sm text-slate-700">
              {reservation.cliente.nombre}
            </div>
            {reservation.cliente.email && (
              <div className="text-xs text-slate-500">
                {reservation.cliente.email}
              </div>
            )}
            {reservation.cliente.telefono && (
              <div className="text-xs text-slate-500">
                {reservation.cliente.telefono}
              </div>
            )}
          </div>

          <div className="mb-8 text-left">
            <ReservationNotificationCard
              status={notification?.status ?? 'pending'}
              lastAttemptAt={notification?.lastAttemptAt ?? null}
              message={notification?.message ?? null}
              loading={notificationLoading}
              errorMessage={notificationError}
              canResend={canResend}
              isResending={isResending}
              onResend={resend}
            />
          </div>

          <div className="space-y-3">
            <Link
              href={`/club/${clubId}`}
              className="block w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Volver al Club
            </Link>

            <Link
              href="/"
              className="block w-full py-3 text-slate-500 font-medium hover:text-slate-900"
            >
              <span className="flex items-center justify-center gap-2">
                <Home size={16} /> Ir al Inicio
              </span>
            </Link>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard
                  .writeText(summaryText)
                  .then(() => showSuccessToast('Comprobante copiado'))
                  .catch(() => showMessageToast('No se pudo copiar el comprobante'));
              }}
              className="w-full py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 hover:bg-slate-50"
            >
              Copiar comprobante
            </button>

            {/* opcional UX: reabrir link (si querés) */}
            {receiptToken && (
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/checkout/success/${reservationId}?receiptToken=${encodeURIComponent(receiptToken)}`;
                  navigator.clipboard
                    .writeText(url)
                    .then(() => showSuccessToast('Link copiado'))
                    .catch(() => showMessageToast('No se pudo copiar el link'));
                }}
                className="w-full py-3 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 hover:bg-slate-50"
              >
                Copiar link del comprobante
              </button>
            )}

            {/* opcional: para cortar loop raro si venís con estado viejo */}
            <button
              type="button"
              onClick={() => router.replace(`/club/${clubId}`)}
              className="w-full py-3 text-slate-400 font-medium hover:text-slate-700"
            >
              Ir al club (sin volver atrás)
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function SuccessPage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = use(params);

  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-green-600" />
        </div>
      }
    >
      <SuccessContent reservationId={reservationId} />
    </Suspense>
  );
}
