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
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { PlayerService } from '@/services/player-service';
import type { CheckoutReservation } from '@/types';
import { PublicTopBar } from '@/app/components/public/public-topbar';

function SuccessContent({ reservationId }: { reservationId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [reservation, setReservation] = useState<CheckoutReservation | null>(null);
  const [loading, setLoading] = useState(true);

  const cacheKey = useMemo(() => `pp:reservation:${reservationId}`, [reservationId]);

  useEffect(() => {
    if (!reservationId) return;

    let cancelled = false;

    const setSafe = (fn: () => void) => {
      if (!cancelled) fn();
    };

    // ✅ 1) Cache-first: si refresca la success, no depende del token
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as CheckoutReservation;
        setSafe(() => {
          setReservation(parsed);
          setLoading(false);
        });

        // Opcional PRO: limpiar cache después de un rato (no “basura eterna”)
        window.setTimeout(() => {
          try {
            sessionStorage.removeItem(cacheKey);
          } catch {}
        }, 10 * 60 * 1000);

        return () => {
          cancelled = true;
        };
      }
    } catch {
      // si sessionStorage falla (modo incógnito, etc), seguimos con fetch
    }

    // ✅ 2) Fallback fetch: si no hay cache, intentamos con token
    const fetchRes = async () => {
      try {
        if (!token) throw new Error('missing token');
        const data = await PlayerService.getCheckout(reservationId, token);

        setSafe(() => {
          setReservation(data);
        });

        // Cachear para futuros refresh
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}
      } catch {
        setSafe(() => setReservation(null));
      } finally {
        setSafe(() => setLoading(false));
      }
    };

    fetchRes();

    return () => {
      cancelled = true;
    };
  }, [token, reservationId, cacheKey]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-green-600" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicTopBar backHref="/" title="Reserva confirmada" />
        <div className="flex h-[70vh] items-center justify-center px-4 text-center text-slate-500">
          <div>
            <p className="text-lg font-bold text-slate-900">Reserva no encontrada</p>
            <p className="mt-2 text-sm text-slate-500">
              Probá volver al inicio o revisar el link.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                <Home size={16} /> Ir al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            Tu turno ha sido reservado con éxito. Te esperamos en el club.
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <MapPin className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Club</p>
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
                <p className="text-xs font-bold text-slate-400 uppercase">Fecha</p>
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
                <p className="text-xs font-bold text-slate-400 uppercase">Horario</p>
                <p className="font-bold text-slate-900">
                  {format(parseISO(reservation.startAt), 'HH:mm')} –{' '}
                  {format(parseISO(reservation.endAt), 'HH:mm')} hs
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-400 uppercase font-bold">Cancha</p>
              <p className="font-bold text-slate-900">{reservation.court.nombre}</p>
              <p className="text-sm text-slate-500">{reservation.court.superficie}</p>
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
