'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toastManager } from '@/lib/toast';
import { useAuthStore } from '@/store/auth-store';

type ReservationStatus =
  | 'HOLD'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED';

type ReservationListItem = {
  reservationId: string;
  status: ReservationStatus;
  startAt: string;
  endAt: string | null;
  clubId: string | null;
  courtId: string | null;
  clubName: string | null;
  courtName: string | null;
  amount: number | null;
};

type ReservationsResponse = {
  items: ReservationListItem[];
  total: number;
  page: number;
  limit: number;
};

type ViewFilter = 'upcoming' | 'past' | 'all';

const statusLabels: Record<ReservationStatus, string> = {
  HOLD: 'En espera',
  PAYMENT_PENDING: 'Pendiente de pago',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
};

function ReservationSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-20 rounded-lg bg-slate-100 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-48 rounded bg-slate-100 animate-pulse" />
            <div className="h-3 w-36 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div className="h-6 w-28 rounded-full bg-slate-100 animate-pulse" />
      </div>
    </div>
  );
}

function formatTimeRange(startAt: string, endAt: string | null) {
  const start = new Date(startAt);
  const startTime = start.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (!endAt) return startTime;
  const end = new Date(endAt);
  const endTime = end.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${startTime}-${endTime}`;
}

function formatDate(startAt: string) {
  const date = new Date(startAt);
  const weekday = date.toLocaleDateString('es-AR', { weekday: 'short' });
  const dayMonth = date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });
  return `${weekday} ${dayMonth}`;
}

function formatShareDate(startAt: string) {
  const date = new Date(startAt);
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });
}

function formatAmount(amount: number | null) {
  if (amount === null || Number.isNaN(amount)) return null;
  const formatted = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `$${formatted}`;
}

export default function MyReservationsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const token = user?.userId ? 'session' : null;
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [items, setItems] = useState<ReservationListItem[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number } | null>(null);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('upcoming');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);
  const [receiptInlineErrorId, setReceiptInlineErrorId] = useState<string | null>(null);
  const [calendarErrorId, setCalendarErrorId] = useState<string | null>(null);

  const initialAbortRef = useRef<AbortController | null>(null);
  const moreAbortRef = useRef<AbortController | null>(null);

  const hasToken = Boolean(token);

  const now = useMemo(() => new Date(), [viewFilter, debouncedSearch, items.length]);

  const headerText = useMemo(() => {
    if (!meta) return 'Mis reservas';
    if (meta.total === 0) return 'Mis reservas';
    return `Mis reservas (${meta.total})`;
  }, [meta]);

  const fetchReservations = async (page: number, mode: 'replace' | 'append') => {
    if (!token) return;

    if (mode === 'replace') {
      setLoading(true);
      setError(null);
      setSessionExpired(false);
      setForbidden(false);
      initialAbortRef.current?.abort();
      const controller = new AbortController();
      initialAbortRef.current = controller;
      try {
        const res = await api.get<ReservationsResponse>('/me/reservations', {
          params: {
            page,
            limit: 10,
          },
          signal: controller.signal,
        });

        setItems(res.data?.items ?? []);
        setMeta({
          total: res.data?.total ?? 0,
          page: res.data?.page ?? page,
          limit: res.data?.limit ?? 10,
        });
      } catch (err: unknown) {
        if (controller.signal.aborted) return;

        if (typeof err === 'object' && err !== null && 'response' in err) {
          const status = (err as { response?: { status?: number } }).response?.status;
          if (status === 401) {
            setSessionExpired(true);
            logout();
            return;
          }
          if (status === 403) {
            setForbidden(true);
            return;
          }
        }

        setError('No pudimos cargar tus reservas.');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
      return;
    }

    setLoadingMore(true);
    moreAbortRef.current?.abort();
    const controller = new AbortController();
    moreAbortRef.current = controller;

    try {
      const res = await api.get<ReservationsResponse>('/me/reservations', {
        params: {
          page,
          limit: meta?.limit ?? 10,
        },
        signal: controller.signal,
      });

      setItems((prev) => [...prev, ...(res.data?.items ?? [])]);
      setMeta({
        total: res.data?.total ?? prevTotal(meta),
        page: res.data?.page ?? page,
        limit: res.data?.limit ?? meta?.limit ?? 10,
      });
    } catch (err: unknown) {
      if (controller.signal.aborted) return;

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401) {
          setSessionExpired(true);
          logout();
          return;
        }
        if (status === 403) {
          setForbidden(true);
          return;
        }
      }

      setError('No pudimos cargar tus reservas.');
    } finally {
      if (!controller.signal.aborted) {
        setLoadingMore(false);
      }
    }
  };

  const prevTotal = (current: { total: number } | null) => current?.total ?? items.length;

  useEffect(() => {
    return () => {
      initialAbortRef.current?.abort();
      moreAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    if (hasToken) {
      fetchReservations(1, 'replace');
    } else {
      setItems([]);
      setMeta(null);
      setError(null);
      setSessionExpired(false);
      setForbidden(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  const filteredItems = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    return items.filter((item) => {
      const start = new Date(item.startAt);
      const matchesTime =
        viewFilter === 'all'
          ? true
          : viewFilter === 'upcoming'
          ? start.getTime() >= now.getTime()
          : start.getTime() < now.getTime();

      if (!matchesTime) return false;

      if (!query) return true;
      const club = item.clubName?.toLowerCase() ?? '';
      const court = item.courtName?.toLowerCase() ?? '';
      return club.includes(query) || court.includes(query);
    });
  }, [items, viewFilter, debouncedSearch, now]);

  const canLoadMore = Boolean(meta && meta.total > items.length);
  const visibleCount = filteredItems.length;
  const totalCount = meta?.total ?? 0;

  const emptyMessage =
    viewFilter === 'upcoming'
      ? 'No tenés reservas próximas.'
      : viewFilter === 'past'
      ? 'Todavía no tenés reservas pasadas.'
      : 'Todavía no tenés reservas.';

  const emptyCta = 'Reservar una cancha';

  const buildShareText = (item: ReservationListItem) => {
    const statusLabel = statusLabels[item.status] ?? item.status;
    const club = item.clubName || 'Club sin nombre';
    const court = item.courtName || 'Cancha por confirmar';
    const day = formatShareDate(item.startAt);
    const time = formatTimeRange(item.startAt, item.endAt);

    return [
      `Reserva ${statusLabel} ✅`,
      `Club: ${club}`,
      `Cancha: ${court}`,
      `Día: ${day}`,
      `Horario: ${time}`,
      `ID: ${item.reservationId}`,
    ].join('\n');
  };

  const setCopiedFeedback = (reservationId: string) => {
    setCopiedId(reservationId);
    window.setTimeout(() => {
      setCopiedId((current) => (current === reservationId ? null : current));
    }, 2000);
  };

  const copyText = async (text: string, reservationId: string, key: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toastManager.success('Copiado.', {
        idempotencyKey: `reservation-copy-${key}-${reservationId}`,
      });
      setCopiedFeedback(reservationId);
    } catch {
      toastManager.error('No pudimos copiar el texto.', {
        idempotencyKey: `reservation-copy-error-${key}-${reservationId}`,
      });
    }
  };

  const formatIcsDate = (iso: string) => {
    const date = new Date(iso);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
      date.getUTCHours(),
    )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
  };

  const formatFileStamp = (iso: string) => {
    const date = new Date(iso);
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(
      date.getHours(),
    )}${pad(date.getMinutes())}`;
  };

  const buildCalendarData = (item: ReservationListItem) => {
    if (!item.startAt || !item.endAt) return null;
    const club = item.clubName || 'Club PadelPoint';
    const court = item.courtName || 'Cancha';
    const summary = `Pádel - ${club} (${court})`;
    const description = [
      `Reserva: ${item.reservationId}`,
      `Estado: ${statusLabels[item.status] ?? item.status}`,
      'PadelPoint',
    ].join('\\n');
    const location = club;
    const dtStart = formatIcsDate(item.startAt);
    const dtEnd = formatIcsDate(item.endAt);

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PadelPoint//Reservas//ES',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${item.reservationId}@padelpoint`,
      `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\\r\\n');

    const fileName = `padelpoint-reserva-${formatFileStamp(item.startAt)}.ics`;

    const googleUrl = new URL('https://calendar.google.com/calendar/render');
    googleUrl.searchParams.set('action', 'TEMPLATE');
    googleUrl.searchParams.set('text', summary);
    googleUrl.searchParams.set(
      'dates',
      `${dtStart.replace(/Z$/, '')}/${dtEnd.replace(/Z$/, '')}`,
    );
    googleUrl.searchParams.set('details', description);
    googleUrl.searchParams.set('location', location);

    return { ics, fileName, googleUrl: googleUrl.toString() };
  };

  const downloadCalendar = (item: ReservationListItem) => {
    const data = buildCalendarData(item);
    if (!data) {
      setCalendarErrorId(item.reservationId);
      return;
    }
    setCalendarErrorId(null);

    const blob = new Blob([data.ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = data.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    toastManager.success('Listo. Se descargó el evento.', {
      idempotencyKey: `reservation-calendar-${item.reservationId}`,
    });
  };

  const handleReceipt = async (reservationId: string) => {
    if (!token || receiptLoadingId === reservationId) return;
    setReceiptInlineErrorId(null);
    setReceiptLoadingId(reservationId);

    try {
      const res = await api.post<{ url?: string }>(
        `/me/reservations/${reservationId}/receipt-link`,
        {},
        {}
      );

      const url = res.data?.url;
      if (!url) {
        throw new Error('missing-url');
      }
      router.push(url);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401) {
          setSessionExpired(true);
          logout();
          return;
        }
        if (status === 409) {
          setReceiptInlineErrorId(reservationId);
          return;
        }
      }

      toastManager.error('No pudimos abrir el comprobante. Intentá nuevamente.', {
        idempotencyKey: `reservation-receipt-error-${reservationId}`,
      });
    } finally {
      setReceiptLoadingId((current) => (current === reservationId ? null : current));
    }
  };

  const handleRebook = (item: ReservationListItem) => {
    if (!item.clubId) {
      toastManager.error('No pudimos abrir el club de esta reserva.', {
        idempotencyKey: `reservation-rebook-missing-club-${item.reservationId}`,
      });
      return;
    }

    const payload = {
      clubId: item.clubId,
      courtId: item.courtId ?? null,
      startAt: item.startAt,
      source: 'me-reservations',
    };

    try {
      sessionStorage.setItem('padel-prefill-reservation', JSON.stringify(payload));
    } catch {}

    router.push(`/club/${item.clubId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{headerText}</h1>
          <p className="mt-2 text-slate-500">Revisá tu historial de reservas.</p>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
            {[
              { key: 'upcoming', label: 'Próximas' },
              { key: 'past', label: 'Pasadas' },
              { key: 'all', label: 'Todas' },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setViewFilter(option.key as ViewFilter)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  viewFilter === option.key
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                aria-label={`Mostrar reservas ${option.label.toLowerCase()}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex w-full items-center sm:w-auto">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar club o cancha"
              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
              aria-label="Buscar club o cancha"
            />
          </div>
        </div>
        {totalCount > 0 && (
          <p className="mb-6 text-sm text-slate-500">
            Mostrando {visibleCount} de {totalCount} reservas
          </p>
        )}

        {!token ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Iniciá sesión para ver tus reservas.</p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : sessionExpired ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Sesión expirada.</p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : forbidden ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Tu cuenta no tiene permisos para ver esto.</p>
          </div>
        ) : loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <ReservationSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => fetchReservations(1, 'replace')}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            {debouncedSearch ? (
              <>
                <p className="text-slate-500">
                  No encontramos reservas que coincidan con tu búsqueda.
                </p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Limpiar búsqueda
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-500">{emptyMessage}</p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
                >
                  {emptyCta}
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredItems.map((item) => {
              const amountLabel = formatAmount(item.amount);
              const shareText = buildShareText(item);
              const calendarData = buildCalendarData(item);
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
              return (
                <button
                  key={item.reservationId}
                  type="button"
                  onClick={() =>
                    setExpandedId((prev) => (prev === item.reservationId ? null : item.reservationId))
                  }
                  role="button"
                  aria-expanded={expandedId === item.reservationId}
                  className="w-full text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          {formatDate(item.startAt)}
                        </p>
                        <p className="text-sm font-bold text-slate-900">
                          {formatTimeRange(item.startAt, item.endAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.clubName || 'Club sin nombre'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {item.courtName || 'Cancha por confirmar'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {amountLabel && (
                        <span className="text-sm font-semibold text-slate-900">{amountLabel}</span>
                      )}
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {statusLabels[item.status] ?? item.status}
                      </span>
                    </div>
                  </div>
                  {expandedId === item.reservationId && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs text-slate-400">
                        ID de reserva: {item.reservationId}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            copyText(shareText, item.reservationId, 'summary');
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          aria-label="Copiar resumen de la reserva"
                        >
                          Copiar resumen
                        </button>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          aria-label="Compartir reserva por WhatsApp"
                        >
                          Compartir por WhatsApp
                        </a>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            copyText(item.reservationId, item.reservationId, 'id');
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          aria-label="Copiar ID de la reserva"
                        >
                          Copiar ID
                        </button>
                        {item.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleReceipt(item.reservationId);
                            }}
                            disabled={receiptLoadingId === item.reservationId}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            aria-label="Ver comprobante de la reserva"
                          >
                            {receiptLoadingId === item.reservationId
                              ? 'Abriendo...'
                              : 'Ver comprobante'}
                          </button>
                        )}
                        {['CONFIRMED', 'PAYMENT_PENDING'].includes(item.status) && (
                          <>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                downloadCalendar(item);
                              }}
                              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              aria-label="Agregar la reserva al calendario"
                            >
                              Agregar al calendario
                            </button>
                            {calendarData && (
                              <a
                                href={calendarData.googleUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => event.stopPropagation()}
                                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                aria-label="Abrir en Google Calendar"
                              >
                                Google Calendar
                              </a>
                            )}
                          </>
                        )}
                        {['CONFIRMED', 'CANCELLED', 'EXPIRED'].includes(item.status) && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRebook(item);
                            }}
                            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            aria-label="Reservar de nuevo esta cancha"
                          >
                            Reservar de nuevo
                          </button>
                        )}
                        {copiedId === item.reservationId && (
                          <span className="text-xs text-slate-400">Copiado</span>
                        )}
                        {receiptInlineErrorId === item.reservationId && (
                          <span className="text-xs text-slate-400">
                            El comprobante todavía no está disponible.
                          </span>
                        )}
                        {calendarErrorId === item.reservationId && (
                          <span className="text-xs text-slate-400">
                            No pudimos generar el evento.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}

            {canLoadMore && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => fetchReservations((meta?.page ?? 1) + 1, 'append')}
                  disabled={loadingMore}
                  className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  {loadingMore ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
