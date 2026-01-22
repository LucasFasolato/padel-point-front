'use client';

import { useEffect, useState } from 'react';
import { useClubStore } from '@/store/club-store';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { 
  Trophy, 
  CalendarDays, 
  Settings, 
  Users, 
  ArrowRight, 
  TrendingUp, 
  Activity 
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();
  const { activeClub, fetchMyClubs } = useClubStore();
  const [stats, setStats] = useState([
    { label: 'Reservas Hoy', value: '0', icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Ingresos Mes', value: '$0', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Canchas Activas', value: '0', icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Clientes Nuevos', value: '0', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]);

  // Ensure club data is loaded
  useEffect(() => {
    fetchMyClubs();
  }, [fetchMyClubs]);

  if (!activeClub) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold text-slate-900">Bienvenido al Panel de Control</h2>
        <p className="text-slate-500 max-w-md mt-2">
          Para comenzar, selecciona o crea un club en la barra lateral.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, {user?.email?.split('@')[0]} 👋
        </h1>
        <p className="text-slate-500">
          Aquí tienes el resumen de lo que pasa en <strong>{activeClub.nombre}</strong>.
        </p>
      </div>

      {/* 2. Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02]">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Activity size={20} className="text-blue-500"/> Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link href="/dashboard/agenda" className="group block p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-1">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
               <CalendarDays size={24} />
            </div>
            <h3 className="text-lg font-bold mb-1">Ver Agenda</h3>
            <p className="text-blue-100 text-sm mb-4">Gestiona los turnos del día.</p>
            <div className="flex items-center gap-2 text-sm font-bold opacity-90 group-hover:gap-3 transition-all">
               Ir ahora <ArrowRight size={16} />
            </div>
          </Link>

          <Link href="/dashboard/courts" className="group block p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition-all hover:-translate-y-1">
             <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4">
               <Trophy size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Mis Canchas</h3>
            <p className="text-slate-500 text-sm mb-4">Edita precios y fotos.</p>
            <span className="text-sm font-bold text-slate-600 group-hover:text-purple-600">Gestionar</span>
          </Link>

          <Link href="/dashboard/settings" className="group block p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition-all hover:-translate-y-1">
             <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mb-4">
               <Settings size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Configuración</h3>
            <p className="text-slate-500 text-sm mb-4">Horarios y reglas.</p>
            <span className="text-sm font-bold text-slate-600 group-hover:text-orange-600">Editar</span>
          </Link>

        </div>
      </div>
    </div>
  );
}