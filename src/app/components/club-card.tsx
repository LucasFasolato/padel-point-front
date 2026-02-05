'use client';

import Link from 'next/link';
import { MapPin, ArrowRight, Star } from 'lucide-react';
import { Club } from '@/types';
import { Badge } from './ui/badge';

interface Props {
  club: Club;
}

export default function ClubCard({ club }: Props) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl">
      {/* Imagen (Placeholder por ahora) */}
      <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10" />
        {/* Aquí iría: <img src={club.imagen} ... /> */}
        <div className="absolute bottom-0 left-0 p-4 z-20 text-white">
            <h3 className="text-xl font-bold leading-tight">{club.nombre}</h3>
            <div className="mt-1 flex items-center gap-1 text-xs font-medium opacity-90">
                <MapPin size={12} />
                <span>{club.direccion}</span>
            </div>
        </div>
        
        {/* Badge de "Popular" (Fake para diseño) */}
        <div className="absolute top-3 right-3 z-20 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-900 shadow-md flex items-center gap-1">
            <Star size={11} className="fill-amber-400 text-amber-400"/> 4.8
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-4 flex gap-2">
            <Badge variant="emerald">Padel</Badge>
            <Badge variant="neutral">Bar</Badge>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100">
            <Link
                href={`/club/${club.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 min-h-[44px]"
            >
                Reservar Ahora <ArrowRight size={16} />
            </Link>
        </div>
      </div>
    </div>
  );
}