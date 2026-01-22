'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // 👈 For redirecting
import * as Drawer from 'vaul';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, X, AlertCircle, Clock, MapPin } from 'lucide-react';
import { useBookingStore } from '@/store/booking-store';
import { PlayerService } from '@/services/player-service';
import { CreateHoldRequest } from '@/types';

export function BookingDrawer() {
  const router = useRouter();
  
  // 1. Get State from Store
  const { 
    isDrawerOpen, 
    closeDrawer, 
    selectedDate, 
    selectedSlot, 
    court, 
    club 
  } = useBookingStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Guest Form
  const [guest, setGuest] = useState({ name: '', phone: '', email: '' });

  // Reset error when opening
  useEffect(() => {
    if (isDrawerOpen) setError('');
  }, [isDrawerOpen]);

  // 2. Handle Reservation (Hold)
  const handleHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!court || !selectedSlot) return;

    setLoading(true);
    setError('');

    try {
      // Construct exact ISO dates combining Day + Slot Time
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const payload: CreateHoldRequest = {
        courtId: court.id,
        // Backend expects ISO strings
        startAt: `${dateStr}T${selectedSlot.horaInicio}:00`,
        endAt: `${dateStr}T${selectedSlot.horaFin}:00`, 
        clienteNombre: guest.name,
        clienteEmail: guest.email || undefined,
        clienteTelefono: guest.phone || undefined,
        precio: court.precioPorHora 
      };

      // Call API
      const res = await PlayerService.createHold(payload);
      
      // 🚀 SUCCESS: Redirect to Checkout
      closeDrawer();
      router.push(`/checkout/${res.checkoutToken}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      // Show error from backend or generic message
      setError(err.response?.data?.message || 'La cancha ya fue ocupada, intenta otro horario.');
    } finally {
      setLoading(false);
    }
  };

  if (!isDrawerOpen) return null;

  return (
    <Drawer.Root open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity" />
        
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[85vh] flex-col rounded-t-[20px] bg-white outline-none md:mx-auto md:max-w-md">
          
          {/* Handle Bar */}
          <div className="flex-1 overflow-y-auto rounded-t-[20px] bg-white p-4">
            <div className="mx-auto mb-6 h-1.5 w-12 flex-shrink-0 rounded-full bg-slate-200" />
            
            <div className="mx-auto max-w-md">
              
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">Confirmar Reserva</h2>
                    <p className="flex items-center gap-1 text-sm text-slate-500">
                      <MapPin size={14} /> {club?.nombre || 'Club'}
                    </p>
                 </div>
                 <button onClick={closeDrawer} className="rounded-full bg-slate-100 p-2 hover:bg-slate-200 transition-colors">
                    <X size={20} className="text-slate-600"/>
                 </button>
              </div>

              {/* Summary Card */}
              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                 <div className="mb-3 flex items-center justify-between">
                    <span className="font-bold text-slate-900">{court?.nombre}</span>
                    <span className="font-bold text-blue-600">
                      $ {court?.precioPorHora.toLocaleString()}
                    </span>
                 </div>
                 
                 <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="flex items-center gap-1 capitalize bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                      <Clock size={14} className="text-slate-400"/>
                      {format(selectedDate, 'EEEE d', { locale: es })}
                    </span>
                    <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                      {selectedSlot?.horaInicio} - {selectedSlot?.horaFin}
                    </span>
                 </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-5 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-pulse">
                   <AlertCircle size={20} className="shrink-0"/> 
                   <p>{error}</p>
                </div>
              )}

              {/* Guest Form */}
              <form onSubmit={handleHold} className="space-y-5">
                 <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Nombre Completo <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Ej: Juan Pérez"
                      value={guest.name}
                      onChange={e => setGuest({...guest, name: e.target.value})}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Teléfono <span className="text-red-500">*</span>
                        </label>
                        <input 
                          required
                          type="tel"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder="341..."
                          value={guest.phone}
                          onChange={e => setGuest({...guest, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                          Email
                        </label>
                        <input 
                          type="email"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                          placeholder="juan@gmail.com"
                          value={guest.email}
                          onChange={e => setGuest({...guest, email: e.target.value})}
                        />
                    </div>
                 </div>

                 {/* Sticky Action Button area */}
                 <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={loading || !guest.name || !guest.phone}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-xl transition-all hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                    >
                      {loading ? <Loader2 className="animate-spin"/> : 'Confirmar y Pagar'}
                    </button>
                    <p className="mt-4 text-center text-xs text-slate-400 px-4">
                        Al continuar, serás redirigido a la pasarela de pago segura. Tienes 10 minutos para completar el pago.
                    </p>
                 </div>
              </form>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}