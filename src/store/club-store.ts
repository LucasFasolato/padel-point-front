import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { Club } from '@/types'; 
// 1. Import Auth Store to access token directly
import { useAuthStore } from './auth-store';

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
          // 2. Get the token directly from the Auth Store (Bulletproof)
          const token = useAuthStore.getState().token;

          if (!token) {
             throw new Error("No token found");
          }

          // 3. Send the token explicitly in this request
          // (This bypasses any potential issues with the global Interceptor)
          const res = await api.get('/clubs/mine', {
            headers: {
                Authorization: `Bearer ${token}`
            }
          });
          
          set({ clubs: res.data, loading: false });
        } catch (error) {
          console.error("Failed to fetch clubs", error);
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