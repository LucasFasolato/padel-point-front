'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Loader2,
  CheckCircle2,
  Calendar,
  MapPin,
  Receipt,
  Share2,
  Copy,
  Check,
  MessageCircle,
} from 'lucide-react';

import { PlayerService } from '@/services/player-service';
import type { CheckoutReservation } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { PublicTopBar } from '@/app/components/public/public-topbar';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { reservationId } = useParams() as { reservationId: string };

  const receiptToken = searchParams.get('receiptToken') ?? '';

  const [reservation, setReservation] = useState<CheckoutReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Build shareable URL
  const receiptUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/checkout/success/${reservationId}?receiptToken=${encodeURIComponent(receiptToken)}`
    : '';

  useEffect(() => {
    let cancelled = false;

    const fetchReceipt = async () => {
      try {
        if (!reservationId || !receiptToken) {
          throw new Error('Faltan datos para mostrar el comprobante.');
        }

        const data = await PlayerService.getReceipt(reservationId, receiptToken);

        if (!cancelled) {
          setReservation(data);
        }
      } catch {
        if (!cancelled) {
          setError('No pudimos cargar el comprobante. Verificá el link o intentá de nuevo.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchReceipt();

    return () => {
      cancelled = true;
    };
  }, [reservationId, receiptToken]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(receiptUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = receiptUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (!reservation) return;

    const fechaFormateada = format(
      new Date(reservation.startAt),
      "EEEE d 'de' MMMM 'a las' HH:mm",
      { locale: es }
    );

    const message = encodeURIComponent(
      `🎾 ¡Reserva confirmada!\n\n` +
      `📍 ${reservation.court.nombre} - ${reservation.court.club.nombre}\n` +
      `📅 ${fechaFormateada} hs\n` +
      `💰 ${formatCurrency(reservation.precio)}\n\n` +
      `🔗 Comprobante: ${receiptUrl}`
    );

    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (!reservation || !navigator.share) return;

    const fechaFormateada = format(
      new Date(reservation.startAt),
      "EEEE d 'de' MMMM 'a las' HH:mm",
      { locale: es }
    );

    try {
      await navigator.share({
        title: 'Reserva confirmada',
        text: `🎾 Reserva en ${reservation.court.nombre} - ${fechaFormateada} hs`,
        url: receiptUrl,
      });
    } catch {
      // User cancelled or share failed, ignore
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p className="text-slate-500">{error ?? 'Comprobante no encontrado.'}</p>
        <button
          onClick={() => router.push('/')}
          className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-bold text-white hover:bg-slate-800"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  const supportsNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <>
      <PublicTopBar
        backHref={reservation.court?.club?.id ? `/club/${reservation.court.club.id}` : '/'}
        title="Comprobante"
      />

      <div className="min-h-[calc(100vh-56px)] bg-slate-50 px-4 py-10 pb-24">
        <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
          {/* Header - Success */}
          <div className="bg-emerald-600 p-6 text-center text-white">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12" />
            <h1 className="text-xl font-bold">¡Reserva confirmada!</h1>
            <p className="mt-1 text-sm text-emerald-100">
              Tu turno está reservado y pagado.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Cancha y Club */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">
                {reservation.court.nombre}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {reservation.court.club.nombre}
              </p>
            </div>

            {/* Detalles */}
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {format(new Date(reservation.startAt), "EEEE d 'de' MMMM", {
                      locale: es,
                    })}
                  </p>
                  <p className="text-sm text-slate-500">
                    {format(new Date(reservation.startAt), 'HH:mm', { locale: es })} -{' '}
                    {format(new Date(reservation.endAt), 'HH:mm', { locale: es })} hs
                  </p>
                </div>
              </div>

              {reservation.court.club.direccion && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <p className="text-sm text-slate-600">
                    {reservation.court.club.direccion}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-slate-400" />
                <p className="text-sm text-slate-600">
                  ID: <span className="font-mono text-xs">{reservation.id.slice(0, 8)}...</span>
                </p>
              </div>
            </div>

            {/* Precio */}
            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4">
              <span className="font-medium text-emerald-900">Total pagado</span>
              <span className="text-xl font-bold text-emerald-700">
                {formatCurrency(reservation.precio)}
              </span>
            </div>

            {/* Cliente */}
            {reservation.cliente && (
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Datos del titular
                </p>
                <div className="text-sm text-slate-600 space-y-1">
                  {reservation.cliente.nombre && <p>{reservation.cliente.nombre}</p>}
                  {reservation.cliente.email && <p>{reservation.cliente.email}</p>}
                  {reservation.cliente.telefono && <p>{reservation.cliente.telefono}</p>}
                </div>
              </div>
            )}

            {/* Share buttons */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Compartir comprobante
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </button>

                {/* Copy link */}
                <button
                  onClick={handleCopyLink}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors ${
                    copied
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check size={18} />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copiar link
                    </>
                  )}
                </button>
              </div>

              {/* Native share (mobile) */}
              {supportsNativeShare && (
                <button
                  onClick={handleNativeShare}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Share2 size={18} />
                  Más opciones
                </button>
              )}
            </div>

            {/* CTA */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => router.push(`/club/${reservation.court.club.id}`)}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
              >
                Reservar otro turno
              </button>

              <button
                onClick={() => router.push('/')}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Volver al inicio
              </button>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-slate-400">
              Guardá este link como comprobante. También te enviamos los detalles por email.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}