'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CheckCircle2, 
  Calendar, 
  ArrowRight, 
  Loader2, 
  MapPin, 
  Clock, 
  Download,
  Share2
} from 'lucide-react';

import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { CheckoutReservation } from '@/types';

export default function SuccessPage({ params }: { params: Promise<{ reservationId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Next.js 15: Unwrap params
  const { reservationId: id } = use(params);
  const token = searchParams.get('token');

  const [reservation, setReservation] = useState<CheckoutReservation | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Fetch & Celebrate
  useEffect(() => {
    if (!token || !id) return;
    
    const init = async () => {
      try {
        const res = await api.get(`/public/reservations/${id}`, { params: { token } });
        setReservation(res.data);
        
        // 🎉 Trigger Confetti on Success
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#10B981', '#3B82F6', '#F59E0B']
          });
          confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#10B981', '#3B82F6', '#F59E0B']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();

      } catch (error) {
        console.error("Error loading reservation", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, token]);

  // 2. Add to Calendar Logic (ICS)
  const handleAddToCalendar = () => {
    if (!reservation) return;
    const start = parseISO(reservation.startAt);
    const end = parseISO(reservation.endAt);
    
    const title = `Padel: ${reservation.court.nombre}`;
    const description = `Reserva en ${reservation.court.club.nombre}. Precio: ${formatCurrency(reservation.precio)}`;
    const location = `${reservation.court.club.nombre}, ${reservation.court.club.direccion}`;
    
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\n");

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reserva-padel.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-emerald-600 h-10 w-10" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Reserva no encontrada.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* SUCCESS HEADER */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-emerald-500/30 shadow-lg"
          >
            <CheckCircle2 className="text-white w-10 h-10" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900">¡Pago Exitoso!</h1>
          <p className="text-slate-500">Tu cancha está reservada.</p>
        </div>

        {/* TICKET CARD */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden relative">
          
          {/* Top Decorative Pattern */}
          <div className="h-3 bg-gradient-to-r from-emerald-400 via-blue-500 to-emerald-400" />

          <div className="p-8">
            {/* DATE & TIME */}
            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-6">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha</p>
                  <p className="text-xl font-bold text-slate-900 capitalize">
                    {format(parseISO(reservation.startAt), "EEE d 'de' MMM", { locale: es })}
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Hora</p>
                  <p className="text-xl font-bold text-blue-600">
                    {format(parseISO(reservation.startAt), "HH:mm")}
                  </p>
               </div>
            </div>

            {/* LOCATION DETAILS */}
            <div className="space-y-4">
               <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{reservation.court.club.nombre}</p>
                    <p className="text-sm text-slate-500">{reservation.court.club.direccion}</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{reservation.court.nombre}</p>
                    <p className="text-sm text-slate-500">{reservation.court.superficie}</p>
                  </div>
               </div>
            </div>

            {/* QR CODE PLACEHOLDER (Visual Polish) */}
            <div className="mt-8 pt-8 border-t border-dashed border-slate-200">
               <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Código Reserva</p>
                    <p className="font-mono font-bold text-slate-800 tracking-widest">
                       #{reservation.id.slice(-6).toUpperCase()}
                    </p>
                  </div>
                  {/* Fake Barcode Visual */}
                  <div className="h-8 w-24 bg-slate-100 flex items-center justify-center rounded">
                     <div className="h-4 w-full border-t-2 border-b-2 border-slate-300 mx-2"></div>
                  </div>
               </div>
            </div>
          </div>

          {/* Bottom Cutout Circles (Ticket Effect) */}
          <div className="absolute bottom-[88px] -left-3 w-6 h-6 bg-slate-100 rounded-full" />
          <div className="absolute bottom-[88px] -right-3 w-6 h-6 bg-slate-100 rounded-full" />
        </div>

        {/* ACTIONS */}
        <div className="mt-6 space-y-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddToCalendar}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-slate-800 flex items-center justify-center gap-2"
          >
            <Calendar size={18} /> Agregar al Calendario
          </motion.button>

          <div className="grid grid-cols-2 gap-3">
             <button 
               onClick={() => router.push(`/club/${reservation.court.club.id}`)}
               className="py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2"
             >
               <ArrowRight size={18} /> Volver
             </button>
             <button className="py-3 bg-white text-slate-600 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2">
               <Share2 size={18} /> Compartir
             </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}