import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  userId: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  hydrated: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  setHydrated: (hydrated: boolean) => void;
  setAuth: (_token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      hydrated: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setHydrated: (hydrated) => set({ hydrated }),
      setAuth: (_token, user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'padel-auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
