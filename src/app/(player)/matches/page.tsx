'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Clock, Trophy, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Reservation } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/button';

export default function MyMatchesPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.get('/reservations/mine');
        setReservations(res.data);
      } catch (e) {
        console.error('Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const upcoming = reservations.filter(
    (r) => !isPast(parseISO(r.endAt)) && r.status !== 'cancelled'
  );
  const history = reservations.filter(
    (r) => isPast(parseISO(r.endAt)) || r.status === 'cancelled'
  );

  const displayed = activeTab === 'upcoming' ? upcoming : history;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Mis Partidos</h1>

      {/* Tabs */}
      <div className="relative mb-6 flex rounded-xl bg-slate-100 p-1">
        <div
          className="absolute inset-y-1 w-1/2 rounded-lg bg-white shadow-sm transition-all duration-300 ease-out"
          style={{ left: activeTab === 'upcoming' ? '4px' : '50%' }}
        />
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`relative z-10 flex-1 py-2.5 text-center text-sm font-bold transition-colors ${
            activeTab === 'upcoming' ? 'text-slate-900' : 'text-slate-500'
          }`}
        >
          Próximos ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`relative z-10 flex-1 py-2.5 text-center text-sm font-bold transition-colors ${
            activeTab === 'history' ? 'text-slate-900' : 'text-slate-500'
          }`}
        >
          Historial ({history.length})
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-slate-400" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-2xl">
              🎾
            </div>
            <p className="font-medium text-slate-500">
              No tienes partidos en esta lista.
            </p>
            {activeTab === 'upcoming' && (
              <Link
                href="/"
                className="mt-2 block font-bold text-blue-600 hover:underline"
              >
                Reservar una cancha
              </Link>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayed.map((res) => (
              <motion.div
                key={res.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <MatchCard reservation={res} showCompetitiveButton={activeTab === 'history'} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// Sub-component
function MatchCard({
  reservation,
  showCompetitiveButton = false,
}: {
  reservation: Reservation;
  showCompetitiveButton?: boolean;
}) {
  const router = useRouter();
  const date = parseISO(reservation.startAt);
  const isPastReservation = isPast(parseISO(reservation.endAt));
  const isConfirmed = reservation.status === 'confirmed';
  
  const statusColors = {
    confirmed: 'bg-green-100 text-green-700',
    hold: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-50 text-red-500 line-through opacity-70',
  };

  const handleCompetitiveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/competitive/challenges/new?reservationId=${reservation.id}`);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/checkout/success/${reservation.id}`}>
        <div className="p-4">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Date Box */}
              <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  {format(date, 'MMM', { locale: es })}
                </span>
                <span className="text-lg font-bold leading-none text-slate-900">
                  {format(date, 'd')}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900">
                  {reservation.court?.club?.nombre || 'Club Padel'}
                </h3>
                <p className="text-xs text-slate-500">{reservation.court?.nombre}</p>
              </div>
            </div>

            <span
              className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase ${
                statusColors[reservation.status] || 'bg-slate-100'
              }`}
            >
              {reservation.status === 'confirmed' ? 'Confirmado' : reservation.status}
            </span>
          </div>

          {/* Info */}
          <div className="flex items-center gap-4 pl-1 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-blue-500" />
              <span className="font-semibold">{format(date, 'HH:mm')} hs</span>
            </div>
            {reservation.court?.club?.direccion && (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <MapPin size={16} className="shrink-0 text-slate-400" />
                <span className="truncate">{reservation.court.club.direccion}</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Botón de desafío competitivo */}
      {showCompetitiveButton && isPastReservation && isConfirmed && (
        <div className="border-t border-slate-100 bg-gradient-to-br from-blue-50 to-purple-50 p-3">
          <Button
            onClick={handleCompetitiveClick}
            variant="outline"
            size="sm"
            className="w-full gap-2 border-2 border-blue-200 bg-white font-semibold text-blue-700 hover:border-blue-300 hover:bg-blue-50"
          >
            <Trophy size={16} />
            Reportar como partido competitivo
          </Button>
        </div>
      )}
    </div>
  );
}