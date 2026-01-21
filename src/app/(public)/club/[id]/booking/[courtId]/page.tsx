'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Added useParams
import api from '@/lib/api';
import { Court } from '@/types';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn, formatCurrency } from '@/lib/utils';
import { ChevronLeft, XCircle, Loader2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

// Define the interface for your Availability Slot
interface AvailabilitySlot {
  courtId: string;
  fecha: string;
  horaInicio: string; // "10:00"
  horaFin: string;    // "11:00"
  ocupado: boolean;
  estado: 'libre' | 'ocupado';
  motivoBloqueo?: string | null;
}

export default function BookingPage() {
  const router = useRouter();
  const params = useParams(); // safer for Next.js 16
  const courtId = params.courtId as string;
  
  // State
  const [court, setCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Booking Form State
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [guestForm, setGuestForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Court Details
  useEffect(() => {
    if (!courtId) return;
    
    const init = async () => {
      try {
        // Matches your PublicCourtsController
        const res = await api.get(`/public/courts/${courtId}`);
        setCourt(res.data);
      } catch (error) {
        console.error("Court not found", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [courtId]);

  // 2. Fetch Availability when Date Changes
  useEffect(() => {
    if (!courtId) return;

    const fetchAvailability = async () => {
      setLoadingSlots(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        
        // Ensure you have this endpoint in your backend!
        const res = await api.get(`/availability`, {
          params: {
            from: dateStr,
            to: dateStr,
            courtId: courtId
          }
        });
        setSlots(res.data);
      } catch (error) {
        console.error("Error fetching slots", error);
        // Fallback empty slots on error
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchAvailability();
  }, [selectedDate, courtId]);

  // 3. Create Hold (Reservation)
  const handleCreateHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !court) return;
    
    setSubmitting(true);
    try {
      // Construct startAt/endAt ISO strings
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const startAtISO = `${dateStr}T${selectedSlot.horaInicio}:00`; 
      const endAtISO = `${dateStr}T${selectedSlot.horaFin}:00`;

      const payload = {
        courtId: court.id,
        startAt: startAtISO,
        endAt: endAtISO,
        clienteNombre: guestForm.name,
        clienteEmail: guestForm.email,
        clienteTelefono: guestForm.phone,
        precio: Number(court.precioPorHora)
      };

      // Ensure you have this endpoint in your backend!
      const res = await api.post('/reservations/hold', payload);
      const reservation = res.data;

      // Redirect to Checkout
      router.push(`/checkout/${reservation.id}?token=${reservation.checkoutToken}`);
      
    } catch (error) {
      console.error(error);
      alert("Error creating reservation. The slot might be taken.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" />
    </div>
  );
  
  if (!court) return <div>Court not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 bg-white/80 px-4 py-4 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-slate-100 transition-colors">
            <ChevronLeft className="h-6 w-6 text-slate-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{court.nombre}</h1>
            <p className="text-xs text-slate-500">{formatCurrency(court.precioPorHora)} / hour</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-6">
        
        {/* Date Selector */}
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Select Date</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {Array.from({ length: 14 }).map((_, i) => {
              const date = addDays(new Date(), i);
              const isSelected = isSameDay(date, selectedDate);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex min-w-[70px] flex-col items-center rounded-2xl border p-3 transition-all active:scale-95",
                    isSelected 
                      ? "border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-200" 
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                  )}
                >
                  <span className="text-xs font-medium uppercase">{format(date, 'EEE', { locale: es })}</span>
                  <span className="text-xl font-bold">{format(date, 'd')}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Availability Grid */}
        <div className="mb-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Available Slots</h2>
          
          {loadingSlots ? (
            <div className="flex h-40 items-center justify-center text-slate-400">
               <Loader2 className="animate-spin mr-2" /> Loading slots...
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 bg-slate-50/50">
              No slots available for this date.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {slots.map((slot, idx) => (
                <button
                  key={idx}
                  disabled={slot.ocupado}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setIsModalOpen(true);
                  }}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-xl border py-4 text-center transition-all",
                    slot.ocupado
                      ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400 opacity-60"
                      : "cursor-pointer border-slate-200 bg-white hover:border-blue-500 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  <span className="text-lg font-bold">{slot.horaInicio}</span>
                  {/* Status Indicator Dot */}
                  <div className={cn(
                    "absolute top-2 right-2 h-2 w-2 rounded-full",
                    slot.ocupado ? "bg-red-300" : "bg-green-400"
                  )} />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Booking Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl outline-none animate-fade-in"> 
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-xl font-bold text-slate-900">Confirm Booking</Dialog.Title>
              <Dialog.Close className="rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors">
                <XCircle size={24} />
              </Dialog.Close>
            </div>

            {selectedSlot && (
              <div className="mb-6 rounded-2xl bg-blue-50 p-4 border border-blue-100">
                <div className="flex justify-between text-blue-900 font-bold text-lg">
                  <span>{format(selectedDate, 'EEEE d', { locale: es })}</span>
                  <span>{selectedSlot.horaInicio}</span>
                </div>
                <div className="mt-1 text-sm text-blue-600 font-medium">
                  {court.nombre} • {formatCurrency(court.precioPorHora)}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateHold} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Lionel Messi"
                  className="w-full rounded-xl border border-slate-300 p-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  value={guestForm.name}
                  onChange={e => setGuestForm({...guestForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input 
                  required
                  type="email" 
                  placeholder="leo@example.com"
                  className="w-full rounded-xl border border-slate-300 p-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  value={guestForm.email}
                  onChange={e => setGuestForm({...guestForm, email: e.target.value})}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
                <input 
                  required
                  type="tel" 
                  placeholder="341..."
                  className="w-full rounded-xl border border-slate-300 p-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  value={guestForm.phone}
                  onChange={e => setGuestForm({...guestForm, phone: e.target.value})}
                />
              </div>

              <p className="text-xs text-slate-400 mt-2 text-center px-4">
                We will hold this slot for 15 minutes while you complete the payment.
              </p>

              <button 
                type="submit" 
                disabled={submitting}
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-slate-900 py-4 font-bold text-white transition-all hover:bg-blue-600 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25"
              >
                {submitting ? <Loader2 className="animate-spin" /> : 'Continue to Payment'}
              </button>
            </form>

          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}