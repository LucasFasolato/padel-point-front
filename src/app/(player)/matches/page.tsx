'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { MapPin, Clock, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { Reservation } from '@/types'; // Ensure this type is robust
import Link from 'next/link';

export default function MyMatchesPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ⚠️ IMPORTANT: backend needs GET /reservations/mine
    // For now we simulate or use the list endpoint filtering by client email if stored locally
    const fetchMatches = async () => {
      try {
        // Replace this with your actual endpoint
        const res = await api.get('/reservations/mine'); 
        setReservations(res.data);
      } catch (e) {
        console.error("Failed to load matches");
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  // Filter Logic
  const upcoming = reservations.filter(r => !isPast(parseISO(r.endAt)) && r.status !== 'cancelled');
  const history = reservations.filter(r => isPast(parseISO(r.endAt)) || r.status === 'cancelled');
  
  const displayed = activeTab === 'upcoming' ? upcoming : history;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Mis Partidos</h1>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-6 relative">
        <div 
          className="absolute inset-y-1 w-1/2 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
          style={{ left: activeTab === 'upcoming' ? '4px' : '50%' }}
        />
        <button 
          onClick={() => setActiveTab('upcoming')}
          className={`relative z-10 flex-1 py-2.5 text-sm font-bold text-center transition-colors ${activeTab === 'upcoming' ? 'text-slate-900' : 'text-slate-500'}`}
        >
          Próximos ({upcoming.length})
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`relative z-10 flex-1 py-2.5 text-sm font-bold text-center transition-colors ${activeTab === 'history' ? 'text-slate-900' : 'text-slate-500'}`}
        >
          Historial
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
           <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div>
        ) : displayed.length === 0 ? (
           <div className="text-center py-10">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🎾</div>
              <p className="text-slate-500 font-medium">No tienes partidos en esta lista.</p>
              {activeTab === 'upcoming' && (
                 <Link href="/" className="text-blue-600 font-bold mt-2 block hover:underline">Reservar una cancha</Link>
              )}
           </div>
        ) : (
           <AnimatePresence mode='popLayout'>
             {displayed.map((res) => (
               <motion.div 
                 key={res.id}
                 layout
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
               >
                 <MatchCard reservation={res} />
               </motion.div>
             ))}
           </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// Sub-component for clean code
function MatchCard({ reservation }: { reservation: Reservation }) {
  const date = parseISO(reservation.startAt);
  const statusColors = {
    confirmed: 'bg-green-100 text-green-700',
    hold: 'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-50 text-red-500 line-through opacity-70'
  };

  return (
    <Link href={`/checkout/success/${reservation.id}`}>
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]">
        <div className="flex justify-between items-start mb-3">
           <div className="flex items-center gap-3">
              {/* Date Box */}
              <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl w-12 h-12">
                 <span className="text-[10px] uppercase font-bold text-slate-400">{format(date, 'MMM', { locale: es })}</span>
                 <span className="text-lg font-bold text-slate-900 leading-none">{format(date, 'd')}</span>
              </div>
              <div>
                 <h3 className="font-bold text-slate-900">{reservation.court?.club?.nombre || 'Club Padel'}</h3>
                 <p className="text-xs text-slate-500">{reservation.court?.nombre}</p>
              </div>
           </div>
           
           <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${statusColors[reservation.status] || 'bg-slate-100'}`}>
             {reservation.status === 'confirmed' ? 'Confirmado' : reservation.status}
           </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600 pl-1">
           <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-blue-500" />
              <span className="font-semibold">{format(date, 'HH:mm')} hs</span>
           </div>
           {reservation.court?.club?.direccion && (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <MapPin size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{reservation.court.club.direccion}</span>
              </div>
           )}
        </div>
      </div>
    </Link>
  );
}