import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { Club } from '@/types';

interface ClubState {
  clubs: Club[];
  activeClub: Club | null;
  loading: boolean;
  fetchMyClubs: () => Promise<void>;
  setActiveClub: (club: Club) => void;
  clearActiveClub: () => void;
}

export const useClubStore = create<ClubState>()(
  persist(
    (set) => ({
      clubs: [],
      activeClub: null,
      loading: false,

      fetchMyClubs: async () => {
        set({ loading: true });
        try {
          const res = await api.get('/clubs/mine');
          set({ clubs: res.data, loading: false });
        } catch (error) {
          console.error('Failed to fetch clubs', error);
          set({ loading: false });
        }
      },

      setActiveClub: (club) => set({ activeClub: club }),
      clearActiveClub: () => set({ activeClub: null }),
    }),
    {
      name: 'padel-club-storage',
    }
  )
);
