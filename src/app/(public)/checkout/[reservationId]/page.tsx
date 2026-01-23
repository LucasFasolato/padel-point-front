'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { PlayerService } from '@/services/player-service';
import type { CheckoutReservation } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { PublicTopBar } from '@/app/components/public/public-topbar';

function mmssFromSeconds(timeLeft: number) {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const reservationId = (useParams() as { reservationId: string }).reservationId;
  const token = searchParams.get('token') ?? '';

  const [reservation, setReservation] = useState<CheckoutReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const run = async () => {
      try {
        if (!reservationId || !token) throw new Error('missing token');
        const data = await PlayerService.getCheckout(reservationId, token);
        setReservation(data);
      } catch {
        toast.error('Reserva no encontrada o token inválido');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [reservationId, token]);

  // Countdown (solo holds)
  useEffect(() => {
    if (!reservation?.expiresAt || reservation.status !== 'hold') return;

    const tick = () => {
      const end = new Date(reservation.expiresAt!).getTime();
      const diff = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setTimeLeft(diff);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [reservation?.expiresAt, reservation?.status]);

  const isExpired = reservation?.status === 'hold' && timeLeft <= 0;

  const mmss = useMemo(() => mmssFromSeconds(timeLeft), [timeLeft]);

  const handleConfirm = async () => {
    if (!reservationId || !token) return;
    if (isExpired) {
      toast.error('El hold expiró. Volvé a elegir otro horario.');
      return;
    }

    setProcessing(true);
    try {
      // ✅ ahora vuelve CheckoutReservation confirmada
      const confirmed = await PlayerService.confirmCheckout(reservationId, token);

      // ✅ cache para success (no refetch)
      sessionStorage.setItem(`pp:reservation:${reservationId}`, JSON.stringify(confirmed));

      toast.success('Pago simulado ✅ Reserva confirmada');
      router.replace(`/checkout/success/${reservationId}?token=${encodeURIComponent(token)}`);
    } catch {
      toast.error('Error al confirmar');
    } finally {
      setProcessing(false);
    }
  };

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
        Reserva inválida
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

                {isExpired && (
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
                <ShieldCheck size={14} className="text-green-500" /> Pagos procesados de forma segura
              </div>

              <button
                onClick={handleConfirm}
                disabled={isExpired || processing || reservation.status !== 'hold'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:bg-slate-300 active:scale-95"
              >
                {processing ? <Loader2 className="animate-spin" /> : 'Pagar ahora (simulado)'}
              </button>

              {isExpired && (
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
