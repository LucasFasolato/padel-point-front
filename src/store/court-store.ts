import { create } from 'zustand';
import api from '@/lib/api';
import { Court } from '@/types'; 

interface CourtState {
  courts: Court[];
  loading: boolean;
  
  fetchCourts: (clubId: string) => Promise<void>;
  addCourt: (court: Court) => void;
  updateCourt: (court: Court) => void;
  removeCourt: (courtId: string) => void;
}

export const useCourtStore = create<CourtState>((set) => ({
  courts: [],
  loading: false,

  fetchCourts: async (clubId) => {
    set({ loading: true });
    try {
      // Assuming your backend has GET /courts/by-club/:clubId (Protected)
      // Or you can use the public one if acceptable, but usually admins have a specific one
      const res = await api.get(`/courts/by-club/${clubId}`);
      set({ courts: res.data, loading: false });
    } catch (error) {
      console.error("Failed to fetch courts", error);
      set({ loading: false });
    }
  },

  addCourt: (court) => set((state) => ({ courts: [...state.courts, court] })),
  
  updateCourt: (updatedCourt) => set((state) => ({
    courts: state.courts.map((c) => c.id === updatedCourt.id ? updatedCourt : c)
  })),

  removeCourt: (courtId) => set((state) => ({
    courts: state.courts.filter((c) => c.id !== courtId)
  })),
}));