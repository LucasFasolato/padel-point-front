'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useClubStore } from '@/store/club-store';
import { useAuthStore } from '@/store/auth-store';
import { format, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Filter, Loader2, MapPin, Clock, User, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import type { Reservation } from '@/types';
import Link from 'next/link';

export default function BookingsPage() {
  const { activeClub } = useClubStore();
  const { user } = useAuthStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  
  // Filtros simples
  const [rangePreset, setRangePreset] = useState<'today' | '7d' | '30d'>('today');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'hold' | 'confirmed' | 'cancelled' | 'expired' | 'payment_pending'
  >('all');
  const presetStorageKey = 'admin:bookings:preset';

  const dateRange = useMemo(() => {
    const from = format(new Date(), 'yyyy-MM-dd');
    const to =
      rangePreset === 'today'
        ? from
        : format(addDays(new Date(), rangePreset === '7d' ? 7 : 30), 'yyyy-MM-dd');
    return { from, to };
  }, [rangePreset]);

  useEffect(() => {
    if (activeClub) {
      fetchBookings();
    }
  }, [activeClub, rangePreset, statusFilter]);

  const fetchBookings = async () => {
    if (!activeClub) return;
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    setSessionExpired(false);
    try {
      // Ajusta este endpoint según tu backend. 
      // Debería ser algo como GET /reservations/by-club/:id?date=...
      // Por ahora usamos el rango genérico que creaste antes
      const res = await api.get(`/reservations/club/${activeClub.id}/range`, {
        params: {
            from: dateRange.from,
            to: dateRange.to,
            status: statusFilter === 'all' ? undefined : statusFilter,
        }
      });
      setReservations(res.data);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401) {
          setSessionExpired(true);
        } else if (status === 403) {
          setUnauthorized(true);
        } else {
          setError('No pudimos cargar las reservas. Intentá de nuevo.');
        }
      } else {
        setError('No pudimos cargar las reservas. Intentá de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem(presetStorageKey) as
      | 'today'
      | '7d'
      | '30d'
      | null;
    if (stored) setRangePreset(stored);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(presetStorageKey, rangePreset);
  }, [rangePreset]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-textMuted">
        <AlertTriangle size={48} className="mb-4 opacity-50 text-warning" />
        <p className="text-sm">No tenés permisos para ver esta sección.</p>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-surface px-4 py-2 text-xs font-bold text-text ring-1 ring-border hover:bg-surface2"
        >
          Volver
        </Link>
      </div>
    );
  }

  if (!activeClub) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-textMuted">
        <Calendar size={48} className="mb-4 opacity-50" />
        <p>Seleccioná un club primero.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header & Filtros */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold text-text">Reservas</h1>
          <p className="text-textMuted">Gestiona los turnos de {activeClub.nombre}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-2 shadow-sm">
          <div className="flex items-center gap-2 border-r border-border px-2 pr-4 text-textMuted">
            <Filter size={16} />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-transparent text-sm font-medium text-text outline-none"
          >
            <option value="all">Todos</option>
            <option value="hold">Hold</option>
            <option value="payment_pending">Pago pendiente</option>
            <option value="confirmed">Confirmada</option>
            <option value="cancelled">Cancelada</option>
            <option value="expired">Expirada</option>
          </select>
          <select
            value={rangePreset}
            onChange={(e) => setRangePreset(e.target.value as typeof rangePreset)}
            className="bg-transparent text-sm font-medium text-text outline-none"
          >
            <option value="today">Hoy</option>
            <option value="7d">Próximos 7 días</option>
            <option value="30d">Próximos 30 días</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setRangePreset('today');
            }}
            className="ml-auto rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold text-textMuted hover:bg-surface2"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-textMuted">
        <span className="font-semibold text-textMuted">Estados:</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface2 px-2 py-0.5 font-semibold text-textMuted">
          HOLD
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">
          PAYMENT_PENDING
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-semibold text-success">
          CONFIRMED
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-danger/30 bg-danger/10 px-2 py-0.5 font-semibold text-danger">
          CANCELLED
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface2 px-2 py-0.5 font-semibold text-textMuted">
          EXPIRED
        </span>
      </div>

      {/* Tabla de Reservas */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-surface2 text-textMuted">
                <tr>
                <th className="px-6 py-4 font-bold">Creada</th>
                <th className="px-6 py-4 font-bold">Club</th>
                <th className="px-6 py-4 font-bold">Cancha</th>
                <th className="px-6 py-4 font-bold">Horario</th>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Precio</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {loading ? (
                    <tr>
                        <td colSpan={7} className="py-10">
                          <div className="space-y-3 px-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-surface2" />
                            ))}
                          </div>
                        </td>
                    </tr>
                ) : sessionExpired ? (
                    <tr>
                        <td colSpan={7} className="py-12 text-center text-textMuted">
                          Sesión expirada. Iniciá sesión nuevamente.
                          <div className="mt-4">
                            <Link
                              href="/admin/login"
                              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                            >
                              Volver
                            </Link>
                          </div>
                        </td>
                    </tr>
                ) : unauthorized ? (
                    <tr>
                        <td colSpan={7} className="py-12 text-center text-textMuted">
                          No tenés permisos para ver esta sección.
                          <div className="mt-4">
                            <Link
                              href="/admin/dashboard"
                              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                            >
                              Volver
                            </Link>
                          </div>
                        </td>
                    </tr>
                ) : error ? (
                    <tr>
                        <td colSpan={7} className="py-12 text-center text-textMuted">
                          <p>{error}</p>
                          <button
                            type="button"
                            onClick={fetchBookings}
                            className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                          >
                            Reintentar
                          </button>
                        </td>
                    </tr>
                ) : (
                    reservations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-textMuted">
                          No hay reservas para este rango.
                        </td>
                      </tr>
                    ) : (
                      reservations.map((res) => (
                      <tr key={res.id} className="transition-colors hover:bg-surface2/60">
                          <td className="px-6 py-4 text-textMuted">
                            {(res as Reservation & { createdAt?: string }).createdAt
                              ? format(
                                  parseISO(
                                    (res as Reservation & { createdAt?: string }).createdAt!,
                                  ),
                                  'dd/MM HH:mm',
                                )
                              : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-textMuted">
                              <MapPin size={16} />
                              {res.court?.club?.nombre || activeClub.nombre}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-textMuted">
                                  <MapPin size={16} />
                                  {res.court?.nombre || 'Cancha no disponible'}
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-2 font-medium text-text">
                                  <Clock size={16} className="text-primary"/>
                                  {format(parseISO(res.startAt), 'HH:mm')} - {format(parseISO(res.endAt), 'HH:mm')}
                              </div>
                              <div className="text-xs text-textMuted">
                                {format(parseISO(res.startAt), "EEEE d MMM", { locale: es })}
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-textMuted">
                                <User size={16} />
                                <div className="flex flex-col">
                                  <span className="font-medium text-text">{res.clienteNombre || 'Cliente Casual'}</span>
                                  <span className="text-xs text-textMuted">{res.clienteEmail || '-'}</span>
                                </div>
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <StatusBadge status={res.status} />
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-text">
                              ${res.precio}
                          </td>
                      </tr>
                      ))
                    )
                )}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

// Badge de Estado
function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        confirmed: 'bg-success/10 text-success border-success/30',
        hold: 'bg-warning/10 text-warning border-warning/30',
        cancelled: 'bg-danger/10 text-danger border-danger/30',
        expired: 'bg-surface2 text-textMuted border-border',
        payment_pending: 'bg-brand-100 text-brand-700 border-brand-200',
    };
    
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-surface2 text-textMuted border-border'}`}>
            {status === 'confirmed'
              ? 'Confirmada'
              : status === 'hold'
              ? 'Hold'
              : status === 'cancelled'
              ? 'Cancelada'
              : status === 'expired'
              ? 'Expirada'
              : status === 'payment_pending'
              ? 'Pendiente de pago'
              : status}
        </span>
    );
}
