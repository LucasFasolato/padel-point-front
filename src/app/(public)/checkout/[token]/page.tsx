'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { Reservation } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string; // We use the checkoutToken from the URL

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [processing, setProcessing] = useState(false);

  // 1. Fetch Reservation Details by Token
  useEffect(() => {
    const fetchCheckout = async () => {
      try {
        // Backend Endpoint: GET /public/reservations/by-token/:token
        // You might need to create this specific endpoint or use the ID+Token query param approach
        // For this code, I assume we query by the Public ID logic we built earlier
        const res = await api.get(`/public/reservations/${token}`); 
        setReservation(res.data);
      } catch (error) {
        console.error(error);
        toast.error("Reserva no encontrada o expirada");
        // router.push('/'); // Redirect to home on fail
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchCheckout();
  }, [token]);

  // 2. Countdown Logic
  useEffect(() => {
    if (!reservation?.expiresAt || reservation.status !== 'hold') return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const end = new Date(reservation.expiresAt!);
      const diff = differenceInSeconds(end, now);
      
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        // Optional: Trigger auto-cancel in UI
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservation]);

  // 3. Confirm / Pay Logic
  const handleConfirm = async () => {
    if (!reservation) return;
    setProcessing(true);
    
    try {
      // Here we would integrate MercadoPago Preference
      // For MVP "Simulate Payment":
      await api.post(`/public/reservations/${reservation.id}/confirm`, {
        token: reservation.checkoutToken // Security check
      });
      
      toast.success("Pago Exitoso!");
      router.replace(`/checkout/success/${reservation.id}?token=${reservation.checkoutToken}`);
      
    } catch (error) {
      toast.error("Error al procesar el pago");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!reservation) return <div className="h-screen flex items-center justify-center">Reserva inválida</div>;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft <= 0 && reservation.status === 'hold';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header with Timer */}
        <div className="bg-slate-900 p-6 text-white text-center relative overflow-hidden">
           {isExpired ? (
             <div className="bg-red-500/20 absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10">
                <span className="font-bold text-lg flex items-center gap-2"><AlertTriangle/> Tiempo Agotado</span>
             </div>
           ) : (
             <div className="flex flex-col items-center">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Tiempo Restante</span>
                <div className="text-4xl font-mono font-bold tabular-nums tracking-tight flex items-center gap-2">
                   <Clock className="text-blue-400" size={32}/>
                   {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
             </div>
           )}
        </div>

        <div className="p-8">
           {/* Summary */}
           <div className="space-y-6">
              <div className="text-center">
                 <h1 className="text-2xl font-bold text-slate-900">{reservation.court?.nombre}</h1>
                 <p className="text-slate-500">{format(new Date(reservation.startAt), "EEEE d 'de' MMMM, HH:mm", { locale: es })} hs</p>
              </div>

              <div className="border-t border-b border-slate-100 py-6 space-y-3">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Precio Turno</span>
                    <span className="font-medium text-slate-900">{formatCurrency(reservation.precio)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Comisión Servicio</span>
                    <span className="font-medium text-slate-900">$0.00</span>
                 </div>
                 <div className="flex justify-between text-lg font-bold pt-2">
                    <span className="text-slate-900">Total a Pagar</span>
                    <span className="text-blue-600">{formatCurrency(reservation.precio)}</span>
                 </div>
              </div>

              {/* Secure Badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 py-2 rounded-lg">
                 <ShieldCheck size={14} className="text-green-500"/> Pagos procesados de forma segura
              </div>

              {/* Action */}
              <button 
                onClick={handleConfirm}
                disabled={isExpired || processing}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="animate-spin"/> : 'Pagar Ahora'}
              </button>
              
              {isExpired && (
                <button 
                  onClick={() => router.push(`/club/${reservation.court?.clubId}`)}
                  className="w-full py-3 text-slate-500 font-medium hover:text-slate-800 transition-colors"
                >
                  Volver a intentar
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}