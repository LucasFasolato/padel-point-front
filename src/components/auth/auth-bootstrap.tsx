'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';
import { getMe } from '@/services/session-service';

export function AuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const user = await getMe();
        if (active) {
          setUser(user);
        }
      } catch (error) {
        if (!active) return;

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          clearUser();
          return;
        }

        clearUser();
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [clearUser, setHydrated, setUser]);

  return null;
}
