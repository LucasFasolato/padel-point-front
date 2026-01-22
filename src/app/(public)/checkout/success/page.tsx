'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Calendar, Clock, MapPin, Home, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '@/lib/api';
import { Reservation } from '@/types';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchRes = async () => {
      try {
        // Re-using the public endpoint to get details
        const res = await api.get(`/public/reservations/${token}`); 
        setReservation(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchRes();
  }, [token]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600"/></div>;
  if (!reservation) return <div className="h-screen flex items-center justify-center">Reserva no encontrada</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl overflow-hidden border border-slate-100 text-center p-8">
        
        <div className="mx-auto mb-6 h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
           <CheckCircle2 size={40} />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">¡Reserva Confirmada!</h1>
        <p className="text-slate-500 mb-8">
          Tu turno ha sido reservado con éxito. Te esperamos en el club.
        </p>

        {/* Ticket Detail */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left space-y-4 mb-8">
           <div className="flex items-start gap-3">
              <MapPin className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase">Cancha</p>
                 <p className="font-bold text-slate-900">{reservation.court?.nombre}</p>
              </div>
           </div>
           
           <div className="flex items-start gap-3">
              <Calendar className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase">Fecha</p>
                 <p className="font-bold text-slate-900 capitalize">
                    {format(parseISO(reservation.startAt), 'EEEE d MMMM', { locale: es })}
                 </p>
              </div>
           </div>

           <div className="flex items-start gap-3">
              <Clock className="text-blue-500 shrink-0 mt-1" size={18} />
              <div>
                 <p className="text-xs font-bold text-slate-400 uppercase">Horario</p>
                 <p className="font-bold text-slate-900">
                    {format(parseISO(reservation.startAt), 'HH:mm')} hs
                 </p>
              </div>
           </div>
        </div>

        <div className="space-y-3">
           <Link 
             href={`/club/${reservation.court?.clubId}`}
             className="block w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
           >
             Volver al Club
           </Link>
           <Link 
             href="/"
             className="block w-full py-3 text-slate-500 font-medium hover:text-slate-900"
           >
             <span className="flex items-center justify-center gap-2"><Home size={16}/> Ir al Inicio</span>
           </Link>
        </div>

      </div>
    </div>
  );
}