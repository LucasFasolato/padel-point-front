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
  const receiptUrl =
    typeof window !== 'undefined'
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
      <div className="flex h-screen items-center justify-center bg-bg">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center">
        <p className="text-textMuted">{error ?? 'Comprobante no encontrado.'}</p>
        <button
          onClick={() => router.push('/')}
          className="rounded-xl bg-primary px-6 py-2 text-sm font-bold text-primary-foreground transition-colors hover:opacity-90"
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

      <div className="min-h-[calc(100vh-56px)] bg-bg px-4 py-10 pb-24">
        <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-border bg-surface shadow-xl">
          {/* Header - Success */}
          <div className="bg-success p-6 text-center text-success-foreground">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12" />
            <h1 className="text-xl font-bold">¡Reserva confirmada!</h1>
            <p className="mt-1 text-sm opacity-90">Tu turno está reservado y pagado.</p>
          </div>

          {/* Body */}
          <div className="space-y-6 p-6">
            {/* Cancha y Club */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-text">{reservation.court.nombre}</h2>
              <p className="mt-1 text-sm text-textMuted">{reservation.court.club.nombre}</p>
            </div>

            {/* Detalles */}
            <div className="space-y-3 rounded-2xl bg-surface2 p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-textMuted" />
                <div>
                  <p className="text-sm font-medium text-text">
                    {format(new Date(reservation.startAt), "EEEE d 'de' MMMM", {
                      locale: es,
                    })}
                  </p>
                  <p className="text-sm text-textMuted">
                    {format(new Date(reservation.startAt), 'HH:mm', { locale: es })} -{' '}
                    {format(new Date(reservation.endAt), 'HH:mm', { locale: es })} hs
                  </p>
                </div>
              </div>

              {reservation.court.club.direccion && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-textMuted" />
                  <p className="text-sm text-textMuted">{reservation.court.club.direccion}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Receipt className="h-5 w-5 text-textMuted" />
                <p className="text-sm text-textMuted">
                  ID: <span className="font-mono text-xs text-text">{reservation.id.slice(0, 8)}...</span>
                </p>
              </div>
            </div>

            {/* Precio */}
            <div className="flex items-center justify-between rounded-2xl bg-surface2 p-4">
              <span className="font-medium text-text">Total pagado</span>
              <span className="text-xl font-bold text-success">{formatCurrency(reservation.precio)}</span>
            </div>

            {/* Cliente */}
            {reservation.cliente && (
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-textMuted">
                  Datos del titular
                </p>
                <div className="space-y-1 text-sm text-textMuted">
                  {reservation.cliente.nombre && <p>{reservation.cliente.nombre}</p>}
                  {reservation.cliente.email && <p>{reservation.cliente.email}</p>}
                  {reservation.cliente.telefono && <p>{reservation.cliente.telefono}</p>}
                </div>
              </div>
            )}

            {/* Share buttons */}
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-textMuted">
                Compartir comprobante
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* WhatsApp */}
                <button
                  onClick={handleShareWhatsApp}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-success text-sm font-semibold text-success-foreground transition-colors hover:opacity-90"
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </button>

                {/* Copy link */}
                <button
                  onClick={handleCopyLink}
                  className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors ${
                    copied
                      ? 'border-border bg-surface2 text-success'
                      : 'border-border bg-surface text-text hover:bg-surface2'
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
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-text transition-colors hover:bg-surface2"
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
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-colors hover:opacity-90"
              >
                Reservar otro turno
              </button>

              <button
                onClick={() => router.push('/')}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-border bg-surface text-sm font-bold text-text transition-colors hover:bg-surface2"
              >
                Volver al inicio
              </button>
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-textMuted">
              Guardá este link como comprobante. También te enviamos los detalles por email.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
