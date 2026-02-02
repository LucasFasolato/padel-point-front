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
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

import { PlayerService } from '@/services/player-service';
import type { CheckoutReservation } from '@/types';
import { PublicTopBar } from '@/app/components/public/public-topbar';

function ErrorState() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicTopBar backHref="/" title="Reserva confirmada" />
      <div className="flex h-[70vh] items-center justify-center px-4 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
          <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={28} />
          </div>

          <p className="text-xl font-extrabold text-slate-900">
            No pudimos cargar tu comprobante
          </p>
          <p className="mt-2 text-sm text-slate-500">
            El link puede estar incompleto o el comprobante pudo haber expirado.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Home size={16} /> Ir al inicio
            </Link>

            <button
              type="button"
              onClick={() => {
                toast.message(
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

function SuccessContent({ reservationId }: { reservationId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ token correcto: receiptToken. Fallback por compatibilidad: token
  const receiptToken =
    searchParams.get('receiptToken') ?? searchParams.get('token') ?? '';

  const [reservation, setReservation] = useState<CheckoutReservation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const cacheKey = useMemo(() => `pp:receipt:${reservationId}`, [reservationId]);

  useEffect(() => {
    if (!reservationId) return;

    let cancelled = false;
    let cleanupTimer: number | null = null;

    const setSafe = (fn: () => void) => {
      if (!cancelled) fn();
    };

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
      if (receiptToken) {
        (async () => {
          try {
            const fresh = await PlayerService.getReceipt(
              reservationId,
              receiptToken,
            );
            writeCache(fresh);
            setSafe(() => setReservation(fresh));
          } catch {
            // si falla, mantenemos cache
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
      } catch {
        setSafe(() => setReservation(null));
      } finally {
        setSafe(() => setLoading(false));
      }
    };

    fetchReceipt();

    return () => {
      cancelled = true;
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
    };
  }, [reservationId, receiptToken, cacheKey]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-green-600" />
      </div>
    );
  }

  if (!reservation) return <ErrorState />;

  const clubId = reservation.court.club.id;

  return (
    <>
      <PublicTopBar backHref={`/club/${clubId}`} title="Reserva confirmada" />

      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-slate-100 text-center p-8">
          {/* ✅ Badge Confirmada */}
          <div className="mb-4 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-xs font-bold text-green-700">
              <CheckCircle2 size={16} /> Confirmada
            </span>
          </div>

          <div className="mx-auto mb-6 h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle2 size={40} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-slate-500 mb-8">
            Tu turno quedó confirmado. Guardá este comprobante (el link dura 14
            días).
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 mb-8">
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

            {/* opcional UX: reabrir link (si querés) */}
            {receiptToken && (
              <button
                type="button"
                onClick={() => {
                  const url = `${window.location.origin}/checkout/success/${reservationId}?receiptToken=${encodeURIComponent(receiptToken)}`;
                  navigator.clipboard
                    .writeText(url)
                    .then(() => toast.success('Link copiado ✅'))
                    .catch(() => toast.message('No se pudo copiar el link'));
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
