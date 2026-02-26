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
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0E7C66] to-[#065F46] px-6 py-20 text-center text-white">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-tight md:text-5xl">
          Encontrá tu cancha.<br /><span className="text-white/80">Jugá Ya.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base text-white/60">
          La forma más simple de reservar canchas de pádel. Sin esperas, sin llamadas.
        </p>
      </div>

      {/* Club List */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Clubes Disponibles</h2>
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-slate-400 shadow-sm border border-slate-100">
             <Search size={16} />
             <span>Buscar club...</span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Cargando clubes...</div>
        ) : clubs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
            No hay clubes activos en este momento.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Link
                key={club.id}
                href={`/club/${club.id}`}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-[#0E7C66]/20"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0E7C66]/10 text-[#0E7C66] group-hover:bg-[#0E7C66] group-hover:text-white transition-colors">
                  <MapPin size={24} />
                </div>

                <h3 className="mb-1 text-lg font-bold text-slate-900 group-hover:text-[#0E7C66]">{club.nombre}</h3>
                <p className="mb-6 text-sm text-slate-500">{club.direccion}</p>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Ver Canchas
                  </span>
                  <ArrowRight size={18} className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#0E7C66]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}