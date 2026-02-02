'use client';

import { useEffect, useMemo, useState, Suspense, use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Home,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { PlayerService } from '@/services/player-service';
import type { CheckoutReservation } from '@/types';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { readReservationCache, saveReservationCache } from '@/lib/checkout-cache';

function ErrorState() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicTopBar backHref="/" title="Reserva confirmada" />
      <div className="flex h-[70vh] items-center justify-center px-4 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-8">
          <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertTriangle size={28} />
          </div>
          <p className="text-xl font-extrabold text-slate-900">No pudimos cargar tu reserva</p>
          <p className="mt-2 text-sm text-slate-500">
            El link parece inválido o vencido.
          </p>

          <div className="mt-6 space-y-3">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Home size={16} /> Ir al inicio
            </Link>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Tip: si venís desde el checkout, volvé a abrir el link original (con receiptToken).
          </p>
        </div>
      </div>
    </div>
  );
}

function SuccessContent({ reservationId }: { reservationId: string }) {
  const searchParams = useSearchParams();

  // ✅ nuevo: receiptToken
  const receiptToken = searchParams.get('receiptToken');

  const [reservation, setReservation] = useState<CheckoutReservation | null>(null);
  const [loading, setLoading] = useState(true);

  const cacheHit = useMemo(() => readReservationCache(reservationId), [reservationId]);

  useEffect(() => {
    let cancelled = false;
    const setSafe = (fn: () => void) => {
      if (!cancelled) fn();
    };

    // 1) Cache first (localStorage)
    if (cacheHit) {
      setSafe(() => {
        setReservation(cacheHit);
        setLoading(false);
      });

      // Revalidación suave si hay receiptToken (para asegurar datos frescos)
      if (receiptToken) {
        (async () => {
          try {
            const fresh = await PlayerService.getReceipt(reservationId, receiptToken);
            saveReservationCache(reservationId, fresh);
            setSafe(() => setReservation(fresh));
          } catch {
            // si falla, mantenemos cache
          }
        })();
      }

      return () => {
        cancelled = true;
      };
    }

    // 2) Si no hay cache -> receipt fetch (confirmada)
    const run = async () => {
      try {
        if (!receiptToken) throw new Error('missing receiptToken');
        const data = await PlayerService.getReceipt(reservationId, receiptToken);

        setSafe(() => setReservation(data));
        saveReservationCache(reservationId, data);
      } catch {
        setSafe(() => setReservation(null));
      } finally {
        setSafe(() => setLoading(false));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [reservationId, receiptToken, cacheHit]);

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
            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-xs font-extrabold text-green-700">
              <CheckCircle2 size={16} /> Confirmada
            </span>
          </div>

          <div className="mx-auto mb-6 h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle2 size={40} />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-slate-500 mb-8">
            Tu turno ha sido reservado con éxito. Te esperamos en el club.
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <MapPin className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase">Club</p>
                <p className="font-extrabold text-slate-900">
                  {reservation.court.club.nombre}
                </p>
                {reservation.court.club.direccion && (
                  <p className="text-sm text-slate-500">{reservation.court.club.direccion}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase">Fecha</p>
                <p className="font-extrabold text-slate-900 capitalize">
                  {format(parseISO(reservation.startAt), 'EEEE d MMMM', { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase">Horario</p>
                <p className="font-extrabold text-slate-900">
                  {format(parseISO(reservation.startAt), 'HH:mm')} –{' '}
                  {format(parseISO(reservation.endAt), 'HH:mm')} hs
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-400 uppercase font-extrabold">Cancha</p>
              <p className="font-extrabold text-slate-900">{reservation.court.nombre}</p>
              <p className="text-sm text-slate-500">{reservation.court.superficie}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href={`/club/${clubId}`}
              className="block w-full py-3 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Volver al Club
            </Link>

            <Link
              href="/"
              className="block w-full py-3 text-slate-500 font-semibold hover:text-slate-900"
            >
              <span className="flex items-center justify-center gap-2">
                <Home size={16} /> Ir al Inicio
              </span>
            </Link>
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
