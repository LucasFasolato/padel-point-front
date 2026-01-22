'use client';

import { useState } from 'react';
import * as Drawer from 'vaul';
import { useBookingStore } from '@/store/booking-store';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { PlayerService } from '@/services/player-service';
import { CreateHoldRequest } from '@/types';

// If you haven't installed 'vaul' yet, run: npm install vaul
// If you prefer standard Dialog, let me know, but Vaul is 10/10 for mobile.

export function BookingDrawer() {
  const { 
    step, selectedDate, selectedTime, selectedCourt, club, 
    reset  } = useBookingStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Guest Form State
  const [guest, setGuest] = useState({ name: '', phone: '', email: '' });

  // 1. Logic to Close
  const isOpen = !!selectedTime && !!selectedCourt;
  const close = () => {
    reset();
    setError('');
    setLoading(false);
  };

  // 2. Logic to Create Hold
  const handleHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourt || !selectedTime) return;

    setLoading(true);
    setError('');

    try {
      // Create strict payload based on your backend DTO
      const payload: CreateHoldRequest = {
        courtId: selectedCourt.id,
        // Construct ISO Dates
        startAt: `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`,
        endAt: calculateEndTime(selectedDate, selectedTime), // Helper below
        clienteNombre: guest.name,
        clienteEmail: guest.email || undefined,
        clienteTelefono: guest.phone || undefined,
        precio: selectedCourt.precioPorHora // Or calculated price
      };

      // Call Service
      const res = await PlayerService.createHold(payload);
      
      console.log('Hold Created:', res);
      // Success! Move to Payment/Checkout Step
      // For now, we just alert success, but next step is redirect to checkout
      alert(`Reserva Creada! Token: ${res.checkoutToken || 'N/A'}`);
      close();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al reservar');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open: boolean) => !open && close()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50 outline-none">
          
          {/* Handle Bar */}
          <div className="p-4 bg-white rounded-t-[10px] flex-1 overflow-y-auto">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-300 mb-6" />
            
            <div className="max-w-md mx-auto">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-xl font-bold text-slate-900">Confirmar Reserva</h2>
                    <p className="text-sm text-slate-500">{club?.nombre}</p>
                 </div>
                 <button onClick={close} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                    <X size={20} className="text-slate-600"/>
                 </button>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                 <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">{selectedCourt?.nombre}</span>
                    <span className="font-bold text-blue-600">{formatCurrency(selectedCourt?.precioPorHora || 0)}</span>
                 </div>
                 <div className="flex gap-2 text-sm text-slate-600">
                    <span className="capitalize">{format(selectedDate, 'EEEE d MMMM', { locale: es })}</span>
                    <span>•</span>
                    <span>{selectedTime} hs</span>
                 </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex gap-2 items-center">
                   <AlertCircle size={16}/> {error}
                </div>
              )}

              {/* Guest Form */}
              <form onSubmit={handleHold} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                    <input 
                      required
                      className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tu nombre"
                      value={guest.name}
                      onChange={e => setGuest({...guest, name: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                        <input 
                          required
                          type="tel"
                          className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="341..."
                          value={guest.phone}
                          onChange={e => setGuest({...guest, phone: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email (Opcional)</label>
                        <input 
                          type="email"
                          className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Email"
                          value={guest.email}
                          onChange={e => setGuest({...guest, email: e.target.value})}
                        />
                    </div>
                 </div>

                 {/* Action Button */}
                 <div className="pt-4">
                    <button 
                      type="submit"
                      disabled={loading || !guest.name || !guest.phone}
                      className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin"/> : 'Reservar Turno'}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-3">
                       Al reservar aceptas los términos y condiciones del club.
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

// Helper to calculate End Time (assuming 90 min slots for now, or 60)
function calculateEndTime(date: Date, startTime: string): string {
  // Parse HH:mm
  const [hours, minutes] = startTime.split(':').map(Number);
  const start = new Date(date);
  start.setHours(hours, minutes, 0, 0);
  
  // Add 90 minutes (Standard Padel) - You can make this dynamic later
  const end = new Date(start.getTime() + 90 * 60000);
  
  return format(end, "yyyy-MM-dd'T'HH:mm:ss");
}