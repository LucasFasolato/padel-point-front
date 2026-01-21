'use client';

import React, { useEffect, useState } from 'react';
import { useClubStore } from '@/store/club-store';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Search, Filter, Loader2, MapPin, Clock, DollarSign, User } from 'lucide-react';
import api from '@/lib/api';
import { Reservation } from '@/types'; // Asegúrate de tener este tipo en src/types/index.ts

export default function BookingsPage() {
  const { activeClub } = useClubStore();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtros simples
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (activeClub) {
      fetchBookings();
    }
  }, [activeClub, filterDate]);

  const fetchBookings = async () => {
    if (!activeClub) return;
    setLoading(true);
    try {
      // Ajusta este endpoint según tu backend. 
      // Debería ser algo como GET /reservations/by-club/:id?date=...
      // Por ahora usamos el rango genérico que creaste antes
      const res = await api.get(`/reservations/club/${activeClub.id}/range`, {
        params: {
            from: filterDate,
            to: filterDate
        }
      });
      setReservations(res.data);
    } catch (error) {
      console.error("Error fetching bookings", error);
    } finally {
      setLoading(false);
    }
  };

  if (!activeClub) return (
    <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <Calendar size={48} className="mb-4 opacity-50"/>
        <p>Selecciona un club primero.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header & Filtros */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservas</h1>
          <p className="text-slate-500">Gestiona los turnos de {activeClub.nombre}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-2 text-slate-500 border-r border-slate-200 pr-4">
                <Filter size={16} />
                <span className="text-sm font-medium">Filtrar</span>
            </div>
            <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="outline-none text-sm font-medium text-slate-700 bg-transparent"
            />
        </div>
      </div>

      {/* Tabla de Reservas */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
                <tr>
                <th className="px-6 py-4 font-bold">Horario</th>
                <th className="px-6 py-4 font-bold">Cancha</th>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 font-bold text-right">Precio</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                            <div className="flex justify-center"><Loader2 className="animate-spin text-blue-600"/></div>
                        </td>
                    </tr>
                ) : reservations.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                            No hay reservas para esta fecha.
                        </td>
                    </tr>
                ) : (
                    reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 font-medium text-slate-900">
                                <Clock size={16} className="text-blue-500"/>
                                {format(parseISO(res.startAt), 'HH:mm')} - {format(parseISO(res.endAt), 'HH:mm')}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600">
                                <MapPin size={16} />
                                {res.court?.nombre || 'Cancha no disponible'}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col">
                                <span className="font-medium text-slate-900">{res.clienteNombre || 'Cliente Casual'}</span>
                                <span className="text-xs text-slate-400">{res.clienteEmail || '-'}</span>
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
    };
    
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
            {status === 'confirmed' ? 'Confirmada' : status}
        </span>
    );
}