'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useClubStore } from '@/store/club-store';
import {
  Loader2,
  Plus,
  MapPin,
  ArrowRight,
  LayoutDashboard,
  Mail,
  Trophy,
  CalendarDays,
  TrendingUp,
  Users,
  Activity,
  CreditCard,
  BarChart3,
  Percent,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Modal from '@/app/components/ui/modal';
import api from '@/lib/api';
import { Club } from '@/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';

type SummaryResponse = {
  clubId: string;
  month: string;
  revenue: {
    totalRevenue: number;
    confirmedCount: number;
    topCourtByRevenue: {
      courtId: string;
      courtName: string;
      value: number;
    } | null;
  };
  occupancy: {
    availableMinutes: number;
    blockedMinutes: number;
    bookableMinutes: number;
    occupiedMinutes: number;
    occupancyPct: number;
    topCourtByOccupancy: {
      courtId: string;
      courtName: string;
      value: number;
    } | null;
  };
  peak: {
    top: {
      dow: number;
      weekday: string;
      time: string;
      count: number;
      revenue: number;
    } | null;
  };
};

type StatsState = {
  loading: boolean;
  error: string | null;
  data: SummaryResponse | null;
};

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const { clubs, activeClub, fetchMyClubs, setActiveClub, loading } = useClubStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newClub, setNewClub] = useState({
    nombre: '',
    direccion: '',
    email: '',
    telefono: '',
  });

  const [stats, setStats] = useState<StatsState>({
    loading: false,
    error: null,
    data: null,
  });

  const currentMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    fetchMyClubs();
  }, [fetchMyClubs]);

  // Fetch stats when activeClub changes
  useEffect(() => {
    if (!activeClub?.id) {
      setStats({ loading: false, error: null, data: null });
      return;
    }

    const fetchStats = async () => {
      setStats((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const res = await api.get<SummaryResponse>('/reports/summary', {
          params: {
            clubId: activeClub.id,
            month: currentMonth,
          },
        });
        setStats({ loading: false, error: null, data: res.data });
      } catch (err: unknown) {
        const status =
          typeof err === 'object' && err !== null && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;

        if (status === 401) {
          setStats({ loading: false, error: 'Sesión expirada', data: null });
        } else if (status === 403) {
          setStats({ loading: false, error: 'Sin permisos', data: null });
        } else {
          setStats({ loading: false, error: 'Error al cargar métricas', data: null });
        }
      }
    };

    fetchStats();
  }, [activeClub?.id, currentMonth]);

  const handleSelectClub = (club: Club) => {
    setActiveClub(club);
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await api.post('/clubs', newClub);
      await fetchMyClubs();
      setIsModalOpen(false);
      setNewClub({ nombre: '', direccion: '', email: '', telefono: '' });
    } catch (error) {
      console.error(error);
      alert('Error al crear el club.');
    } finally {
      setIsCreating(false);
    }
  };

  const refreshStats = () => {
    if (!activeClub?.id) return;
    setStats((prev) => ({ ...prev, loading: true, error: null }));

    api
      .get<SummaryResponse>('/reports/summary', {
        params: { clubId: activeClub.id, month: currentMonth },
      })
      .then((res) => setStats({ loading: false, error: null, data: res.data }))
      .catch(() => setStats((prev) => ({ ...prev, loading: false, error: 'Error al cargar' })));
  };

  // Build stats cards from real data
  const statsCards = [
    {
      label: 'Reservas (mes)',
      value: stats.data?.revenue.confirmedCount ?? '-',
      icon: CalendarDays,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
    },
    {
      label: 'Ingresos (mes)',
      value: stats.data ? formatCurrency(stats.data.revenue.totalRevenue) : '-',
      icon: TrendingUp,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Ocupación (mes)',
      value: stats.data ? `${stats.data.occupancy.occupancyPct}%` : '-',
      icon: Percent,
      color: 'text-slate-600',
      bg: 'bg-surface2',
    },
    {
      label: 'Hora pico',
      value: stats.data?.peak.top
        ? `${stats.data.peak.top.weekday} ${stats.data.peak.top.time}`
        : '-',
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
  ];

  if (!token) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-textMuted">
        <LayoutDashboard size={48} className="mb-4 opacity-50" />
        <p className="text-sm">Sesión expirada. Iniciá sesión nuevamente.</p>
        <Link
          href="/admin/login"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
        >
          Volver
        </Link>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-textMuted">
        <LayoutDashboard size={48} className="mb-4 opacity-50" />
        <p className="text-sm">No tenés permisos para ver esta sección.</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
        >
          Volver
        </Link>
      </div>
    );
  }

  if (loading && clubs.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">
            Hola, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-textMuted">Panel operativo para gestionar tu club.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-700 active:scale-95"
        >
          <Plus size={18} /> Nuevo Club
        </button>
      </div>

      {/* Stats Cards */}
      {activeClub && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-textMuted">
              Métricas de {format(new Date(), 'MMMM yyyy')}
            </h2>
            <button
              onClick={refreshStats}
              disabled={stats.loading}
              className="flex items-center gap-1 text-xs text-textMuted transition-colors hover:text-text disabled:opacity-50"
            >
              <RefreshCw size={14} className={stats.loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          {stats.error && (
            <div className="flex items-center gap-3 rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
              <AlertTriangle size={18} />
              {stats.error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}
                >
                  {stats.loading ? (
                    <Loader2 size={24} className="animate-spin opacity-50" />
                  ) : (
                    <stat.icon size={24} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-textMuted">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-text">
                    {stats.loading ? (
                      <span className="inline-block h-7 w-16 animate-pulse rounded bg-surface2" />
                    ) : (
                      stat.value
                    )}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Top performers */}
          {stats.data && (stats.data.revenue.topCourtByRevenue || stats.data.occupancy.topCourtByOccupancy) && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {stats.data.revenue.topCourtByRevenue && (
                <div className="rounded-xl border border-success/20 bg-success/10 p-4">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-success">
                    Cancha más rentable
                  </p>
                  <p className="text-lg font-bold text-text">
                    {stats.data.revenue.topCourtByRevenue.courtName}
                  </p>
                  <p className="text-sm text-textMuted">
                    {formatCurrency(stats.data.revenue.topCourtByRevenue.value)} este mes
                  </p>
                </div>
              )}
              {stats.data.occupancy.topCourtByOccupancy && (
                <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-warning">
                    Mayor ocupación
                  </p>
                  <p className="text-lg font-bold text-text">
                    {stats.data.occupancy.topCourtByOccupancy.courtName}
                  </p>
                  <p className="text-sm text-textMuted">
                    {stats.data.occupancy.topCourtByOccupancy.value}% de ocupación
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Access */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-text">
          <Activity size={20} className="text-brand-600" /> Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Link
            href="/admin/bookings"
            className="group block rounded-2xl bg-brand-700 p-6 text-white shadow-lg transition-all hover:-translate-y-1"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <CalendarDays size={24} />
            </div>
            <h3 className="mb-1 text-lg font-bold">Reservas</h3>
            <p className="mb-4 text-sm text-brand-100">Ver y filtrar turnos.</p>
            <div className="flex items-center gap-2 text-sm font-bold opacity-90 transition-all group-hover:gap-3">
              Ir ahora <ArrowRight size={16} />
            </div>
          </Link>

          <Link
            href="/admin/payments"
            className="group block rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <CreditCard size={24} />
            </div>
            <h3 className="mb-1 text-lg font-bold text-text">Pagos</h3>
            <p className="mb-4 text-sm text-textMuted">Intents y estados.</p>
            <span className="text-sm font-bold text-textMuted transition-colors group-hover:text-success">
              Gestionar
            </span>
          </Link>

          <Link
            href="/admin/courts"
            className="group block rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Trophy size={24} />
            </div>
            <h3 className="mb-1 text-lg font-bold text-text">Canchas</h3>
            <p className="mb-4 text-sm text-textMuted">Configuración básica.</p>
            <span className="text-sm font-bold text-textMuted transition-colors group-hover:text-warning">
              Gestionar
            </span>
          </Link>
        </div>
      </div>

      {/* Active Club Card */}
      {activeClub && (
        <div className="overflow-hidden rounded-2xl bg-slate-900 text-white shadow-xl ring-1 ring-slate-900/5">
          <div className="flex flex-col items-start justify-between gap-6 p-8 md:flex-row">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-success">
                  Club Activo
                </p>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">{activeClub.nombre}</h2>
              <div className="mt-4 flex flex-col gap-2 text-slate-300">
                <p className="flex items-center gap-2">
                  <MapPin size={16} /> {activeClub.direccion}
                </p>
                <p className="flex items-center gap-2 text-sm opacity-70">
                  <Mail size={14} /> {activeClub.email}
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <LayoutDashboard size={40} className="text-brand-400" />
            </div>
          </div>
        </div>
      )}

      {/* Club List */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-text">Mis Clubes</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <button
              key={club.id}
              onClick={() => handleSelectClub(club)}
              className={`group relative flex flex-col items-start rounded-2xl border p-6 text-left transition-all hover:-translate-y-1 hover:shadow-xl ${
                activeClub?.id === club.id
                  ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-600'
                  : 'border-border bg-surface hover:border-brand-300'
              }`}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-surface2 text-textMuted transition-colors group-hover:bg-brand-100 group-hover:text-brand-600">
                <LayoutDashboard size={20} />
              </div>
              <h3 className="text-lg font-bold text-text transition-colors group-hover:text-brand-700">
                {club.nombre}
              </h3>
              <p className="mt-1 line-clamp-1 text-sm text-textMuted">{club.direccion}</p>

              <div className="mt-6 flex w-full items-center justify-between border-t border-border/50 pt-4">
                <span
                  className={`text-xs font-bold uppercase ${
                    activeClub?.id === club.id ? 'text-brand-600' : 'text-textMuted'
                  }`}
                >
                  {activeClub?.id === club.id ? 'Gestionando' : 'Entrar'}
                </span>
                <ArrowRight
                  size={16}
                  className={`text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-brand-600 ${
                    activeClub?.id === club.id ? 'text-brand-600' : ''
                  }`}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Create Club Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Registrar Nuevo Club"
      >
        <form onSubmit={handleCreateClub} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text">Nombre del Club</label>
            <input
              required
              className="w-full rounded-xl border border-border p-3 outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ej: Padel Center"
              value={newClub.nombre}
              onChange={(e) => setNewClub({ ...newClub, nombre: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text">Dirección</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-textMuted" size={18} />
              <input
                required
                className="w-full rounded-xl border border-border p-3 pl-10 outline-none focus:ring-2 focus:ring-ring"
                placeholder="Calle 123"
                value={newClub.direccion}
                onChange={(e) => setNewClub({ ...newClub, direccion: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-text">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-border p-3 outline-none focus:ring-2 focus:ring-ring"
                placeholder="contacto@club.com"
                value={newClub.email}
                onChange={(e) => setNewClub({ ...newClub, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text">Teléfono</label>
              <input
                type="tel"
                required
                className="w-full rounded-xl border border-border p-3 outline-none focus:ring-2 focus:ring-ring"
                placeholder="+54 9..."
                value={newClub.telefono}
                onChange={(e) => setNewClub({ ...newClub, telefono: e.target.value })}
              />
            </div>
          </div>

          <button
            disabled={isCreating}
            type="submit"
            className="mt-4 flex w-full justify-center rounded-xl bg-slate-900 py-3 font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-70"
          >
            {isCreating ? <Loader2 className="animate-spin" /> : 'Crear Club'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
