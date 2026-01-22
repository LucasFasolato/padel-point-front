import { create } from 'zustand';
import { Court, Club } from '@/types';

interface BookingState {
  step: 'DATE' | 'SLOT' | 'CONFIRM' | 'PAYMENT';
  selectedDate: Date;
  selectedCourt: Court | null;
  selectedTime: string | null; // "19:00"
  club: Club | null;
  
  // Actions
  setClub: (club: Club) => void;
  setDate: (date: Date) => void;
  setCourt: (court: Court) => void;
  setTime: (time: string) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  step: 'DATE',
  selectedDate: new Date(),
  selectedCourt: null,
  selectedTime: null,
  club: null,

  setClub: (club) => set({ club }),
  setDate: (date) => set({ selectedDate: date, selectedTime: null, step: 'SLOT' }),
  setCourt: (court) => set({ selectedCourt: court }),
  setTime: (time) => set({ selectedTime: time, step: 'CONFIRM' }),
  reset: () => set({ step: 'DATE', selectedTime: null, selectedCourt: null }),
}));