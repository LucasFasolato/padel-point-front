'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Reservation } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Calendar, MapPin, ArrowRight, Download, Share2 } from 'lucide-react';

export default function SuccessPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [reservation, setReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchRes = async () => {
      try {
        const res = await api.get(`/public/reservations/${params.id}`, {
          params: { token }
        });
        setReservation(res.data);
      } catch (error) {
        console.error("Error loading reservation");
      }
    };
    fetchRes();
  }, [params.id, token]);

  const handleAddToCalendar = () => {
    if (!reservation) return;
    const start = parseISO(reservation.startAt);
    const end = parseISO(reservation.endAt);
    
    // Simple .ics generator for robustness without external libs
    const title = "Padel Match - PadelPoint";
    const details = `Cancha ID: ${reservation.courtId}`;
    const location = "Club PadelPoint"; // In a real app, use club.direccion
    
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${details}`,
      `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'padel-reservation.ics');
    document.body.appendChild(link);
    link.click();
  };

  if (!reservation) return <div className="flex h-screen items-center justify-center">Cargando ticket...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden ring-1 ring-slate-100">
        
        {/* Success Header */}
        <div className="bg-emerald-500 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-white drop-shadow-md" />
          <h1 className="text-2xl font-bold">¡Reserva Confirmada!</h1>
          <p className="text-emerald-100 mt-1 opacity-90">Tu turno está asegurado.</p>
        </div>

        {/* Ticket Body */}
        <div className="p-8 relative">
          {/* Ticket "Tear" Effect */}
          <div className="absolute top-0 left-0 w-full flex justify-between -mt-3">
             <div className="h-6 w-6 bg-slate-50 rounded-full -ml-3" />
             <div className="flex-1 border-t-2 border-dashed border-slate-200 mt-3 mx-2" />
             <div className="h-6 w-6 bg-slate-50 rounded-full -mr-3" />
          </div>

          <div className="space-y-6 mt-4">
            <div className="text-center">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">Fecha</p>
              <p className="text-2xl font-bold text-slate-800 capitalize">
                {format(parseISO(reservation.startAt), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <p className="text-lg text-blue-600 font-medium">
                {format(parseISO(reservation.startAt), "HH:mm")} - {format(parseISO(reservation.endAt), "HH:mm")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div>
                  <p className="text-xs text-slate-400 mb-1">Cancha</p>
                  <p className="font-semibold text-slate-700">Court {reservation.courtId?.slice(-4)}</p>
               </div>
               <div className="text-right">
                  <p className="text-xs text-slate-400 mb-1">Precio</p>
                  <p className="font-semibold text-slate-700">{formatCurrency(reservation.precio)}</p>
               </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button 
              onClick={handleAddToCalendar}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
            >
              <Calendar size={18} /> Agregar a Calendario
            </button>
            
            <button 
              onClick={() => router.push(`/club/${reservation.court?.id || ''}`)} // Redirects back to club (requires parsing clubId correctly in real app)
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              Volver al Club <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
           <p className="text-xs text-slate-400">ID de Reserva: {reservation.id}</p>
        </div>
      </div>
    </div>
  );
}