import { create } from 'zustand';
import { Club, Court, AvailabilitySlot } from '@/types';

interface BookingState {
  // Data State
  club: Club | null;
  court: Court | null;
  selectedDate: Date;
  selectedSlot: AvailabilitySlot | null; // 👈 NEW
  
  // UI State
  isDrawerOpen: boolean; // 👈 NEW

  // Actions
  setClub: (club: Club) => void;
  setCourt: (court: Court) => void;
  setDate: (date: Date) => void;
  setSelectedSlot: (slot: AvailabilitySlot | null) => void; // 👈 NEW
  
  // Drawer Actions
  openDrawer: () => void;  // 👈 NEW
  closeDrawer: () => void; // 👈 NEW
}

export const useBookingStore = create<BookingState>((set) => ({
  // Initial State
  club: null,
  court: null,
  selectedDate: new Date(),
  selectedSlot: null,
  isDrawerOpen: false,

  // Actions implementation
  setClub: (club) => set({ club }),
  setCourt: (court) => set({ court }),
  setDate: (date) => set({ selectedDate: date }),
  
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false, selectedSlot: null }), // Reset slot on close
}));