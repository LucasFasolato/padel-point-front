'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, Clock, MapPin, Calendar, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reservation } from '@/types'; 

export default function CheckoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const reservationId = params.id as string;
  const token = searchParams.get('token'); // 🔐 Security token from URL

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 1. Fetch Reservation Details
  useEffect(() => {
    if (!reservationId || !token) return;
    
    const fetchReservation = async () => {
      try {
        // GET /public/reservations/:id?token=...
        const res = await api.get(`/public/reservations/${reservationId}`, {
            params: { token } 
        });
        setReservation(res.data);
      } catch (error) {
        console.error("Error loading reservation", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId, token]);

  // 2. Handle Payment (Simulation)
  const handlePayment = async () => {
    if (!reservation || !token) return;
    setProcessing(true);
    
    try {
      // POST /public/reservations/:id/confirm
      await api.post(`/public/reservations/${reservationId}/confirm`, { 
        token 
      }); 
      
      // ✅ Success Feedback
      // In a real app with MercadoPago, this is where you'd handle the callback.
      // For now, we simulate a successful payment.
      const confirmMsg = confirm("¡Pago exitoso! Tu cancha ha sido reservada. \n\n¿Volver al inicio?");
      if (confirmMsg) {
          router.push('/');
      }

    } catch (error) {
      console.error("Payment failed", error);
      alert("Hubo un error al procesar el pago. Por favor intenta nuevamente.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Cargando reserva...</p>
      </div>
    </div>
  );

  if (!reservation) return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="mb-4 rounded-full bg-red-100 p-4 text-red-500">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Reserva no encontrada</h2>
      <p className="text-slate-500 mt-2 max-w-xs mx-auto">
        El enlace puede haber expirado o la reserva ya no es válida.
      </p>
      <button 
        onClick={() => router.push('/')}
        className="mt-6 font-bold text-blue-600 hover:underline"
      >
        Volver al inicio
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-lg">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-sm">
            <Clock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Confirmá tu Reserva</h1>
          <p className="text-slate-500 mt-2">
            Tenés <span className="font-bold text-slate-700">15 minutos</span> para completar el pago.
          </p>
        </div>

        {/* Ticket Card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
          
          {/* Top Section: Dark Info */}
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>
            
            <h2 className="text-xl font-bold relative z-10">
                {reservation.court?.club?.nombre || "Club de Padel"}
            </h2>
            
            <div className="mt-6 flex items-start gap-4 text-blue-100 relative z-10">
              <div className="rounded-lg bg-white/10 p-2">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-70">Fecha y Hora</p>
                <p className="font-medium text-white capitalize text-lg">
                  {reservation.startAt && format(parseISO(reservation.startAt), "EEEE d 'of' MMMM", { locale: es })}
                </p>
                <p className="text-blue-300 font-mono">
                  {reservation.startAt && format(parseISO(reservation.startAt), "HH:mm", { locale: es })} hs
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-4 text-blue-100 relative z-10">
              <div className="rounded-lg bg-white/10 p-2">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider opacity-70">Ubicación</p>
                <p className="font-medium text-white">
                  {reservation.court?.club?.direccion || "Dirección del club"}
                </p>
              </div>
            </div>
          </div>

          {/* Middle Section: Price Breakdown */}
          <div className="p-8 border-b border-dashed border-slate-200 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-medium">Cancha</span>
              <span className="font-bold text-slate-900">{reservation.court?.nombre}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-medium">Duración</span>
              <span className="font-bold text-slate-900">60 min</span>
            </div>
            
            <div className="my-6 border-t border-slate-100"></div>

            <div className="flex justify-between items-end">
              <span className="font-bold text-slate-900 text-lg">Total a Pagar</span>
              <span className="font-bold text-blue-600 text-3xl tracking-tight">
                {formatCurrency(reservation.precio)}
              </span>
            </div>
          </div>

          {/* Bottom Section: Payment Button */}
          <div className="bg-slate-50 p-8">
            <button 
              onClick={handlePayment}
              disabled={processing}
              className="w-full rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-xl shadow-slate-300 transition-all hover:bg-blue-600 hover:shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  Pagar Ahora <ArrowRight size={20} />
                </>
              )}
            </button>
            
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <CheckCircle size={12} className="text-green-500" />
                <span>Pagos procesados de forma segura</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}