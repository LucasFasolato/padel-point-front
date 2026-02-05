'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Club } from '@/types';
import { MapPin, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await api.get('/clubs'); 
        setClubs(res.data);
      } catch (error) {
        console.error("Error fetching clubs", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-slate-900 px-6 py-16 text-center text-white">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Encontrá tu cancha. <span className="text-blue-500">Jugá Ya.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-400">
          La forma más simple de reservar canchas de pádel. Sin esperas, sin llamadas.
        </p>
      </div>

      {/* Club List */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Clubes Disponibles</h2>
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-400 shadow-sm ring-1 ring-slate-200">
             <Search size={16} />
             <span>Buscar club...</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Cargando clubes...</div>
        ) : clubs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No hay clubes activos en este momento.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Link 
                key={club.id} 
                href={`/club/${club.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-lg hover:ring-blue-200"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <MapPin size={24} />
                </div>
                
                <h3 className="mb-1 text-lg font-bold text-slate-900 group-hover:text-blue-600">{club.nombre}</h3>
                <p className="mb-6 text-sm text-slate-500">{club.direccion}</p>
                
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Ver Canchas
                  </span>
                  <ArrowRight size={18} className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}