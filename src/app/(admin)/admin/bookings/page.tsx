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
  
  // Filtros simples
  const [rangePreset, setRangePreset] = useState<'today' | '7d' | '30d'>('today');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'hold' | 'confirmed' | 'cancelled' | 'expired' | 'payment_pending'
  >('all');

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
    } catch (error) {
      console.error("Error fetching bookings", error);
      setError('No pudimos cargar las reservas. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

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
        <Calendar size={48} className="mb-4 opacity-50" />
        <p>Seleccioná un club primero.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header & Filtros */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservas</h1>
          <p className="text-slate-500">Gestiona los turnos de {activeClub.nombre}</p>
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
            <option value="hold">Hold</option>
            <option value="payment_pending">Pago pendiente</option>
            <option value="confirmed">Confirmada</option>
            <option value="cancelled">Cancelada</option>
            <option value="expired">Expirada</option>
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
        </div>
      </div>

      {/* Tabla de Reservas */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
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
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr>
                        <td colSpan={7} className="py-10">
                          <div className="space-y-3 px-6">
                            {Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="h-10 w-full rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                          </div>
                        </td>
                    </tr>
                ) : error ? (
                    <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
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
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          No hay reservas para este rango.
                        </td>
                      </tr>
                    ) : (
                      reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 text-slate-500">
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
                            <div className="flex items-center gap-2 text-slate-600">
                              <MapPin size={16} />
                              {res.court?.club?.nombre || activeClub.nombre}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-slate-600">
                                  <MapPin size={16} />
                                  {res.court?.nombre || 'Cancha no disponible'}
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-2 font-medium text-slate-900">
                                  <Clock size={16} className="text-blue-500"/>
                                  {format(parseISO(res.startAt), 'HH:mm')} - {format(parseISO(res.endAt), 'HH:mm')}
                              </div>
                              <div className="text-xs text-slate-400">
                                {format(parseISO(res.startAt), "EEEE d MMM", { locale: es })}
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-slate-600">
                                <User size={16} />
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-900">{res.clienteNombre || 'Cliente Casual'}</span>
                                  <span className="text-xs text-slate-400">{res.clienteEmail || '-'}</span>
                                </div>
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <StatusBadge status={res.status} />
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
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
        confirmed: 'bg-green-100 text-green-700 border-green-200',
        hold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        cancelled: 'bg-red-50 text-red-500 border-red-100',
        expired: 'bg-slate-100 text-slate-500 border-slate-200',
        payment_pending: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
            {status === 'confirmed'
              ? 'Confirmada'
              : status === 'hold'
              ? 'Hold'
              : status === 'cancelled'
              ? 'Cancelada'
              : status === 'expired'
              ? 'Expirada'
              : status === 'payment_pending'
              ? 'Pago pendiente'
              : status}
        </span>
    );
}
