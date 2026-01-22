import { create } from 'zustand';
import { format, startOfDay, endOfDay } from 'date-fns';
import api from '@/lib/api';
import { Reservation } from '@/types'; // Ensure this matches your types file

interface AgendaState {
  selectedDate: Date;
  reservations: Reservation[];
  loading: boolean;
  
  // Actions
  setSelectedDate: (date: Date) => void;
  fetchReservations: (clubId: string) => Promise<void>;
}

export const useAgendaStore = create<AgendaState>((set, get) => ({
  selectedDate: new Date(),
  reservations: [],
  loading: false,

  setSelectedDate: (date) => set({ selectedDate: date }),

  fetchReservations: async (clubId) => {
    const { selectedDate } = get();
    set({ loading: true });
    
    try {
      // Calculate start and end of the selected day for the query
      const from = startOfDay(selectedDate).toISOString();
      const to = endOfDay(selectedDate).toISOString();

      // Ensure your backend supports query params: ?from=...&to=...
      const res = await api.get(`/reservations/club/${clubId}/range`, {
        params: { from, to }
      });

      set({ reservations: res.data, loading: false });
    } catch (error) {
      console.error("Failed to fetch reservations", error);
      set({ loading: false, reservations: [] });
    }
  },
}));