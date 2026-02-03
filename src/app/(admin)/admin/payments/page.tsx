'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useClubStore } from '@/store/club-store';
import { format, addDays } from 'date-fns';
import { AlertTriangle, Filter, Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

type PaymentIntentStatus = 'PENDING' | 'APPROVED' | 'FAILED';

type PaymentIntentRow = {
  id: string;
  createdAt: string;
  reservationId: string;
  status: PaymentIntentStatus;
  amount: number;
  currency: string;
  providerEventId?: string | null;
};

type PaymentIntentListResponse =
  | PaymentIntentRow[]
  | { items: PaymentIntentRow[]; total: number };

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const { activeClub } = useClubStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [rows, setRows] = useState<PaymentIntentRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | PaymentIntentStatus>('all');
  const [rangePreset, setRangePreset] = useState<'today' | '7d' | '30d'>('today');
  const [reservationSearch, setReservationSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const presetStorageKey = 'admin:payments:preset';

  const dateRange = useMemo(() => {
    const from = format(new Date(), 'yyyy-MM-dd');
    const to =
      rangePreset === 'today'
        ? from
        : format(addDays(new Date(), rangePreset === '7d' ? 7 : 30), 'yyyy-MM-dd');
    return { from, to };
  }, [rangePreset]);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    setEndpointMissing(false);
    setUnauthorized(false);
    setSessionExpired(false);
    try {
      const res = await api.get<PaymentIntentListResponse>('/payments/intents', {
        params: {
          from: dateRange.from,
          to: dateRange.to,
          status: statusFilter === 'all' ? undefined : statusFilter,
          reservationId: reservationSearch.trim() || undefined,
          clubId: activeClub?.id,
          limit,
          offset,
        },
      });
      if (Array.isArray(res.data)) {
        setRows(res.data ?? []);
        setTotal(null);
      } else {
        setRows(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
      }
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401) {
          setSessionExpired(true);
        } else if (status === 403) {
          setUnauthorized(true);
        } else if (status === 404 || status === 501) {
          setEndpointMissing(true);
          setRows([]);
          setTotal(null);
        } else {
          setError('No pudimos cargar los pagos. Intentá de nuevo.');
        }
      } else {
        setError('No pudimos cargar los pagos. Intentá de nuevo.');
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

  useEffect(() => {
    setOffset(0);
  }, [rangePreset, statusFilter, reservationSearch, activeClub?.id]);

  useEffect(() => {
    fetchPayments();
  }, [rangePreset, statusFilter, reservationSearch, activeClub?.id, offset]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <AlertTriangle size={48} className="mb-4 opacity-50" />
        <p className="text-sm">No tenés permisos para ver esta sección.</p>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          Volver
        </Link>
      </div>
    );
  }

  if (!activeClub) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <AlertTriangle size={48} className="mb-4 opacity-50" />
        <p className="text-sm">Seleccioná un club primero.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
          <p className="text-slate-500">Historial de intents de pago</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-2 text-slate-500 border-r border-slate-200 pr-4">
            <Filter size={16} />
            <span className="text-sm font-medium">Filtros</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none"
          >
            <option value="all">Todos</option>
            <option value="PENDING">Pendiente</option>
            <option value="APPROVED">Aprobado</option>
            <option value="FAILED">Fallido</option>
          </select>
          <select
            value={rangePreset}
            onChange={(e) => setRangePreset(e.target.value as typeof rangePreset)}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none"
          >
            <option value="today">Hoy</option>
            <option value="7d">Próximos 7 días</option>
            <option value="30d">Próximos 30 días</option>
          </select>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <Search size={14} className="text-slate-400" />
            <input
              value={reservationSearch}
              onChange={(e) => setReservationSearch(e.target.value)}
              placeholder="Reservation ID"
              className="text-sm text-slate-700 outline-none bg-transparent"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setRangePreset('today');
              setReservationSearch('');
              setOffset(0);
            }}
            className="ml-auto rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">Estados:</span>
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
          PAYMENT_PENDING
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 font-semibold text-green-700">
          CONFIRMED
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-semibold text-slate-600">
          HOLD
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 font-semibold text-red-600">
          CANCELLED
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
          EXPIRED
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Creado</th>
                <th className="px-6 py-4 font-bold">Reserva</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold">Monto</th>
                <th className="px-6 py-4 font-bold">Moneda</th>
                <th className="px-6 py-4 font-bold">Provider Event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10">
                    <div className="space-y-3 px-6">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : sessionExpired ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
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
                  <td colSpan={6} className="py-12 text-center text-slate-500">
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
              ) : endpointMissing ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Panel de pagos próximamente. Falta el endpoint admin para listar intents.
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={fetchPayments}
                      className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                    >
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No hay pagos para este rango.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-500">
                      {format(new Date(row.createdAt), 'dd/MM HH:mm')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {row.reservationId}
                    </td>
                    <td className="px-6 py-4">
                      <PaymentStatusBadge status={row.status} />
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {row.amount}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {row.currency}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {row.providerEventId || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {total !== null && (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm text-slate-500">
          <button
            type="button"
            onClick={() => setOffset((prev) => Math.max(0, prev - limit))}
            disabled={offset === 0}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setOffset((prev) => prev + limit)}
            disabled={offset + limit >= total}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentIntentStatus }) {
  const styles: Record<PaymentIntentStatus, string> = {
    APPROVED: 'bg-green-100 text-green-700 border-green-200',
    FAILED: 'bg-red-50 text-red-500 border-red-100',
    PENDING: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const label =
    status === 'APPROVED'
      ? 'Confirmada'
      : status === 'FAILED'
      ? 'Fallida'
      : 'Pendiente de pago';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {label}
    </span>
  );
}
