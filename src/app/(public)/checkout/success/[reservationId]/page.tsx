'use client';

import { Suspense, use, useEffect, useMemo, useState } from 'react';
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
  ShieldCheck,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { PlayerService } from '@/services/player-service';
import type { CheckoutReservation } from '@/types';
import { PublicTopBar } from '@/app/components/public/public-topbar';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min (ajustable)

type CachedSuccess = {
  v: 1;
  savedAt: number; // epoch ms
  data: CheckoutReservation;
};

function isFreshCache(raw: string | null): raw is string {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as CachedSuccess;
    if (!parsed || parsed.v !== 1) return false;
    if (!parsed.savedAt || typeof parsed.savedAt !== 'number') return false;
    if (!parsed.data) return false;
    return Date.now() - parsed.savedAt <= CACHE_TTL_MS;
  } catch {
    return false;
  }
}

function getBadge(status: CheckoutReservation['status']) {
  if (status === 'confirmed') {
    return {
      text: 'Confirmada',
      icon: <CheckCircle2 size={16} />,
      className: 'bg-green-100 text-green-700',
    };
  }
  if (status === 'cancelled') {
    return {
      text: 'Cancelada',
      icon: <AlertTriangle size={16} />,
      className: 'bg-red-100 text-red-700',
    };
  }
  return {
    text: 'Pendiente',
    icon: <Clock size={16} />,
    className: 'bg-amber-100 text-amber-700',
  };
}

function SuccessContent({ reservationId }: { reservationId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [reservation, setReservation] = useState<CheckoutReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [hadToken, setHadToken] = useState<boolean>(!!token);

  const cacheKey = useMemo(() => `pp:reservation:${reservationId}`, [reservationId]);

  useEffect(() => {
    if (!reservationId) return;

    let cancelled = false;
    const safe = (fn: () => void) => {
      if (!cancelled) fn();
    };

    safe(() => setHadToken(!!token));

    // 1) Cache-first (anti refresh)
    try {
      const raw = sessionStorage.getItem(cacheKey);

      if (isFreshCache(raw)) {
        const parsed = JSON.parse(raw) as CachedSuccess;
        safe(() => {
          setReservation(parsed.data);
          setLoading(false);
        });
        return () => {
          cancelled = true;
        };
      }

      // Si existe pero expiró TTL, lo limpiamos
      if (raw) {
        try {
          sessionStorage.removeItem(cacheKey);
        } catch {}
      }
    } catch {
      // sessionStorage puede fallar (incógnito / policies). Seguimos con fetch.
    }

    // 2) Fallback fetch (requiere token)
    const fetchRes = async () => {
      try {
        if (!token) throw new Error('missing token');
        const data = await PlayerService.getCheckout(reservationId, token);

        safe(() => setReservation(data));

        // Cachear para futuros refresh
        try {
          const payload: CachedSuccess = { v: 1, savedAt: Date.now(), data };
          sessionStorage.setItem(cacheKey, JSON.stringify(payload));
        } catch {}
      } catch {
        safe(() => setReservation(null));
      } finally {
        safe(() => setLoading(false));
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

  // Estado robusto: sin cache y sin token => no podemos recuperar
  if (!reservation) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicTopBar backHref="/" title="Reserva confirmada" />

        <div className="flex h-[70vh] items-center justify-center px-4 text-center text-slate-500">
          <div className="max-w-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle />
            </div>

            <p className="text-lg font-bold text-slate-900">No pudimos cargar tu reserva</p>

            <p className="mt-2 text-sm text-slate-500">
              {hadToken
                ? 'El link parece inválido o vencido.'
                : 'No hay token y no encontramos cache local (posible refresh en otro dispositivo).'}
            </p>

            <div className="mt-6 space-y-3">
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
              >
                <Home size={16} /> Ir al inicio
              </Link>

              <p className="text-xs text-slate-400">
                Tip: si venís desde el checkout, volvé a abrir el link original (con token).
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const clubId = reservation.court.club.id;
  const badge = getBadge(reservation.status);

  return (
    <>
      <PublicTopBar backHref={`/club/${clubId}`} title="Reserva confirmada" />

      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-slate-100 text-center p-8">
          {/* Badge */}
          <div className="mb-4 flex justify-center">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${badge.className}`}
            >
              {badge.icon} {badge.text}
            </span>
          </div>

          <div className="mx-auto mb-6 h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <CheckCircle2 size={40} />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {reservation.status === 'confirmed' ? '¡Reserva Confirmada!' : 'Estado de la reserva'}
          </h1>

          <p className="text-slate-500 mb-8">
            {reservation.status === 'confirmed'
              ? 'Tu turno ha sido reservado con éxito. Te esperamos en el club.'
              : reservation.status === 'cancelled'
                ? 'Esta reserva fue cancelada. Podés volver al club y elegir otro horario.'
                : 'Esta reserva todavía no está confirmada.'}
          </p>

          {/* Card */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <MapPin className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Club</p>
                <p className="font-bold text-slate-900">{reservation.court.club.nombre}</p>
                {reservation.court.club.direccion && (
                  <p className="text-sm text-slate-500">{reservation.court.club.direccion}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Fecha</p>
                <p className="font-bold text-slate-900 capitalize">
                  {format(parseISO(reservation.startAt), 'EEEE d MMMM', { locale: es })}
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

          {/* microcopy seguridad */}
          {reservation.status === 'confirmed' && (
            <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-slate-50 py-2 text-xs text-slate-400">
              <ShieldCheck size={14} className="text-green-500" /> Confirmación registrada correctamente
            </div>
          )}

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
