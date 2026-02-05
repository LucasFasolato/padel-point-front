'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useClubStore } from '@/store/club-store';
import { useAuthStore } from '@/store/auth-store';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Percent,
  Clock,
  Trophy,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  Activity,
} from 'lucide-react';
import { format, subMonths, addMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';

// Types matching backend responses
type RevenueResponse = {
  clubId: string;
  from: string;
  to: string;
  totalRevenue: number;
  confirmedCount: number;
  byCourt: Array<{
    courtId: string;
    courtName: string;
    count: number;
    revenue: number;
  }>;
};

type OccupancyResponse = {
  clubId: string;
  month: string;
  totals: {
    availableMinutes: number;
    blockedMinutes: number;
    bookableMinutes: number;
    occupiedMinutes: number;
    occupancyPct: number;
  };
  byCourt: Array<{
    courtId: string;
    courtName: string;
    availableMinutes: number;
    blockedMinutes: number;
    bookableMinutes: number;
    occupiedMinutes: number;
    occupancyPct: number;
  }>;
};

type PeakHoursResponse = {
  clubId: string;
  month: string;
  top: Array<{
    dow: number;
    weekday: string;
    time: string;
    count: number;
    revenue: number;
  }>;
  matrix: Array<{
    dow: number;
    weekday: string;
    buckets: Array<{
      time: string;
      count: number;
      revenue: number;
    }>;
  }>;
};

type MetricsState = {
  loading: boolean;
  error: string | null;
  revenue: RevenueResponse | null;
  occupancy: OccupancyResponse | null;
  peakHours: PeakHoursResponse | null;
};

export default function MetricsPage() {
  const { user } = useAuthStore();
  const { activeClub } = useClubStore();

  const [selectedDate, setSelectedDate] = useState<Date>(startOfMonth(new Date()));
  const [metrics, setMetrics] = useState<MetricsState>({
    loading: false,
    error: null,
    revenue: null,
    occupancy: null,
    peakHours: null,
  });

  const selectedMonth = format(selectedDate, 'yyyy-MM');
  const monthLabel = format(selectedDate, 'MMMM yyyy', { locale: es });

  const canGoNext = selectedDate < startOfMonth(new Date());

  useEffect(() => {
    if (!activeClub?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMetrics({ loading: false, error: null, revenue: null, occupancy: null, peakHours: null });
      return;
    }

    const fetchMetrics = async () => {
      setMetrics((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [revenueRes, occupancyRes, peakRes] = await Promise.all([
          api.get<RevenueResponse>('/reports/revenue', {
            params: {
              clubId: activeClub.id,
              from: format(selectedDate, 'yyyy-MM-01'),
              to: format(selectedDate, 'yyyy-MM-28'), // Safe end of month
            },
          }),
          api.get<OccupancyResponse>('/reports/occupancy', {
            params: {
              clubId: activeClub.id,
              month: selectedMonth,
            },
          }),
          api.get<PeakHoursResponse>('/reports/peak-hours', {
            params: {
              clubId: activeClub.id,
              month: selectedMonth,
            },
          }),
        ]);

        setMetrics({
          loading: false,
          error: null,
          revenue: revenueRes.data,
          occupancy: occupancyRes.data,
          peakHours: peakRes.data,
        });
      } catch (err: unknown) {
        const status =
          typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;

        if (status === 401) {
          setMetrics((prev) => ({ ...prev, loading: false, error: 'Sesión expirada' }));
        } else if (status === 403) {
          setMetrics((prev) => ({ ...prev, loading: false, error: 'Sin permisos' }));
        } else {
          setMetrics((prev) => ({ ...prev, loading: false, error: 'Error al cargar métricas' }));
        }
      }
    };

    fetchMetrics();
  }, [activeClub?.id, selectedMonth, selectedDate]);

  const goToPrevMonth = () => setSelectedDate(subMonths(selectedDate, 1));
  const goToNextMonth = () => {
    if (canGoNext) setSelectedDate(addMonths(selectedDate, 1));
  };

  // Permission check
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-textMuted">
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

  // No club selected
  if (!activeClub) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-textMuted">
        <BarChart3 size={48} className="mb-4 opacity-50" />
        <p className="text-sm">Seleccioná un club en el Dashboard para ver métricas.</p>
        <Link
          href="/admin/dashboard"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          Ir al Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-textMuted hover:bg-surface2 hover:text-text"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text">Métricas</h1>
            <p className="text-textMuted">{activeClub.nombre}</p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-1 shadow-sm">
          <button
            onClick={goToPrevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-textMuted hover:bg-surface2"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-3">
            <Calendar size={16} className="text-textMuted" />
            <span className="min-w-[140px] text-center font-semibold text-text capitalize">
              {monthLabel}
            </span>
          </div>
          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-textMuted hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Error State */}
      {metrics.error && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-danger/10 p-4 text-sm text-danger">
          <AlertTriangle size={18} />
          {metrics.error}
        </div>
      )}

      {/* Loading State */}
      {metrics.loading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Content */}
      {!metrics.loading && !metrics.error && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Ingresos totales"
              value={formatCurrency(metrics.revenue?.totalRevenue ?? 0)}
              icon={DollarSign}
              color="text-success"
              bg="bg-success/10"
            />
            <SummaryCard
              label="Reservas confirmadas"
              value={String(metrics.revenue?.confirmedCount ?? 0)}
              icon={Trophy}
              color="text-primary"
              bg="bg-primary/10"
            />
            <SummaryCard
              label="Ocupación promedio"
              value={`${metrics.occupancy?.totals.occupancyPct ?? 0}%`}
              icon={Percent}
              color="text-brand-700"
              bg="bg-brand-100"
            />
            <SummaryCard
              label="Horas ocupadas"
              value={`${Math.round((metrics.occupancy?.totals.occupiedMinutes ?? 0) / 60)}h`}
              icon={Clock}
              color="text-warning"
              bg="bg-warning/10"
            />
          </div>

          {/* Revenue by Court */}
          {metrics.revenue && metrics.revenue.byCourt.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-text">Ingresos por cancha</h2>
                  <p className="text-sm text-textMuted">Desglose del mes</p>
                </div>
              </div>

              <div className="space-y-3">
                {metrics.revenue.byCourt.map((court) => {
                  const maxRevenue = Math.max(...metrics.revenue!.byCourt.map((c) => c.revenue));
                  const pct = maxRevenue > 0 ? (court.revenue / maxRevenue) * 100 : 0;

                  return (
                    <div key={court.courtId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-text">{court.courtName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-textMuted">{court.count} reservas</span>
                          <span className="font-bold text-text">{formatCurrency(court.revenue)}</span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Occupancy by Court */}
          {metrics.occupancy && metrics.occupancy.byCourt.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-text">Ocupación por cancha</h2>
                  <p className="text-sm text-textMuted">Porcentaje de uso vs disponibilidad</p>
                </div>
              </div>

              <div className="space-y-3">
                {metrics.occupancy.byCourt.map((court) => (
                  <div key={court.courtId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-text">{court.courtName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-textMuted">
                          {Math.round(court.occupiedMinutes / 60)}h / {Math.round(court.bookableMinutes / 60)}h
                        </span>
                        <span className="font-bold text-text">{court.occupancyPct}%</span>
                      </div>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          court.occupancyPct >= 70
                            ? 'bg-success'
                            : court.occupancyPct >= 40
                            ? 'bg-primary'
                            : 'bg-slate-300'
                        )}
                        style={{ width: `${court.occupancyPct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Peak Hours */}
          {metrics.peakHours && metrics.peakHours.top.length > 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <Clock size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-text">Horarios más demandados</h2>
                  <p className="text-sm text-textMuted">Top 10 del mes</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-left font-semibold text-textMuted">Día</th>
                      <th className="pb-3 text-left font-semibold text-textMuted">Hora</th>
                      <th className="pb-3 text-right font-semibold text-textMuted">Reservas</th>
                      <th className="pb-3 text-right font-semibold text-textMuted">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {metrics.peakHours.top.slice(0, 10).map((row, idx) => (
                      <tr key={`${row.dow}-${row.time}-${idx}`} className="hover:bg-surface2/60">
                        <td className="py-3 font-medium text-text">{row.weekday}</td>
                        <td className="py-3 text-textMuted">{row.time}</td>
                        <td className="py-3 text-right font-semibold text-text">{row.count}</td>
                        <td className="py-3 text-right font-semibold text-success">
                          {formatCurrency(row.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!metrics.revenue || metrics.revenue.byCourt.length === 0) &&
            (!metrics.occupancy || metrics.occupancy.byCourt.length === 0) && (
              <div className="rounded-2xl border-2 border-dashed border-border bg-surface2 p-12 text-center">
                <BarChart3 size={48} className="mx-auto mb-4 text-textMuted opacity-60" />
                <h3 className="text-lg font-bold text-text">Sin datos para este mes</h3>
                <p className="mt-1 text-sm text-textMuted">No hay reservas confirmadas en {monthLabel}.</p>
              </div>
            )}
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg} ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-textMuted">{label}</p>
        <h3 className="text-2xl font-bold text-text">{value}</h3>
      </div>
    </div>
  );
}
