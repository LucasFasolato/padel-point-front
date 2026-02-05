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
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Ingresos (mes)',
      value: stats.data ? formatCurrency(stats.data.revenue.totalRevenue) : '-',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Ocupación (mes)',
      value: stats.data ? `${stats.data.occupancy.occupancyPct}%` : '-',
      icon: Percent,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Hora pico',
      value: stats.data?.peak.top
        ? `${stats.data.peak.top.weekday} ${stats.data.peak.top.time}`
        : '-',
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  if (!token) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <LayoutDashboard size={48} className="mb-4 opacity-50" />
        <p className="text-sm">Sesión expirada. Iniciá sesión nuevamente.</p>
        <Link
          href="/admin/login"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          Volver
        </Link>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <LayoutDashboard size={48} className="mb-4 opacity-50" />
        <p className="text-sm">No tenés permisos para ver esta sección.</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          Volver
        </Link>
      </div>
    );
  }

  if (loading && clubs.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hola, {user?.email?.split('@')[0]}
          </h1>
          <p className="text-slate-500">Panel operativo para gestionar tu club.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          <Plus size={18} /> Nuevo Club
        </button>
      </div>

      {/* Stats Cards */}
      {activeClub && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
              Métricas de {format(new Date(), 'MMMM yyyy')}
            </h2>
            <button
              onClick={refreshStats}
              disabled={stats.loading}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <RefreshCw size={14} className={stats.loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          {stats.error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 flex items-center gap-3 text-sm text-red-600">
              <AlertTriangle size={18} />
              {stats.error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
              >
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}
                >
                  {stats.loading ? (
                    <Loader2 size={24} className="animate-spin opacity-50" />
                  ) : (
                    <stat.icon size={24} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {stats.loading ? (
                      <span className="inline-block h-7 w-16 rounded bg-slate-100 animate-pulse" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {stats.data.revenue.topCourtByRevenue && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">
                    Cancha más rentable
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {stats.data.revenue.topCourtByRevenue.courtName}
                  </p>
                  <p className="text-sm text-slate-600">
                    {formatCurrency(stats.data.revenue.topCourtByRevenue.value)} este mes
                  </p>
                </div>
              )}
              {stats.data.occupancy.topCourtByOccupancy && (
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border border-purple-100">
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">
                    Mayor ocupación
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    {stats.data.occupancy.topCourtByOccupancy.courtName}
                  </p>
                  <p className="text-sm text-slate-600">
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
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-blue-500" /> Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/bookings"
            className="group block p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-1"
          >
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
              <CalendarDays size={24} />
            </div>
            <h3 className="text-lg font-bold mb-1">Reservas</h3>
            <p className="text-blue-100 text-sm mb-4">Ver y filtrar turnos.</p>
            <div className="flex items-center gap-2 text-sm font-bold opacity-90 group-hover:gap-3 transition-all">
              Ir ahora <ArrowRight size={16} />
            </div>
          </Link>

          <Link
            href="/admin/payments"
            className="group block p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition-all hover:-translate-y-1"
          >
            <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-4">
              <CreditCard size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Pagos</h3>
            <p className="text-slate-500 text-sm mb-4">Intents y estados.</p>
            <span className="text-sm font-bold text-slate-600 group-hover:text-green-600">
              Gestionar
            </span>
          </Link>

          <Link
            href="/admin/courts"
            className="group block p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition-all hover:-translate-y-1"
          >
            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Trophy size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Canchas</h3>
            <p className="text-slate-500 text-sm mb-4">Configuración básica.</p>
            <span className="text-sm font-bold text-slate-600 group-hover:text-purple-600">
              Gestionar
            </span>
          </Link>
        </div>
      </div>

      {/* Active Club Card */}
      {activeClub && (
        <div className="overflow-hidden rounded-2xl bg-slate-900 text-white shadow-xl ring-1 ring-slate-900/5">
          <div className="p-8 flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <p className="text-xs font-bold uppercase tracking-wider text-green-400">
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
            <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-sm border border-white/10">
              <LayoutDashboard size={40} className="text-blue-400" />
            </div>
          </div>
        </div>
      )}

      {/* Club List */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-slate-900">Mis Clubes</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((club) => (
            <button
              key={club.id}
              onClick={() => handleSelectClub(club)}
              className={`group relative flex flex-col items-start rounded-2xl border p-6 text-left transition-all hover:shadow-xl hover:-translate-y-1 ${
                activeClub?.id === club.id
                  ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600'
                  : 'border-slate-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="mb-4 h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <LayoutDashboard size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">
                {club.nombre}
              </h3>
              <p className="mt-1 text-sm text-slate-500 line-clamp-1">{club.direccion}</p>

              <div className="mt-6 w-full flex justify-between items-center border-t border-slate-200/50 pt-4">
                <span
                  className={`text-xs font-bold uppercase ${
                    activeClub?.id === club.id ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  {activeClub?.id === club.id ? 'Gestionando' : 'Entrar'}
                </span>
                <ArrowRight
                  size={16}
                  className={`text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all ${
                    activeClub?.id === club.id ? 'text-blue-600' : ''
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
            <label className="text-sm font-medium text-slate-700">Nombre del Club</label>
            <input
              required
              className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Padel Center"
              value={newClub.nombre}
              onChange={(e) => setNewClub({ ...newClub, nombre: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Dirección</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                required
                className="w-full rounded-xl border border-slate-300 p-3 pl-10 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Calle 123"
                value={newClub.direccion}
                onChange={(e) => setNewClub({ ...newClub, direccion: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                required
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contacto@club.com"
                value={newClub.email}
                onChange={(e) => setNewClub({ ...newClub, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Teléfono</label>
              <input
                type="tel"
                required
                className="w-full rounded-xl border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+54 9..."
                value={newClub.telefono}
                onChange={(e) => setNewClub({ ...newClub, telefono: e.target.value })}
              />
            </div>
          </div>

          <button
            disabled={isCreating}
            type="submit"
            className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-blue-600 transition-colors disabled:opacity-70 mt-4 flex justify-center"
          >
            {isCreating ? <Loader2 className="animate-spin" /> : 'Crear Club'}
          </button>
        </form>
      </Modal>
    </div>
  );
}