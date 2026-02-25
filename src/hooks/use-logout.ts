'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { logout as logoutSession } from '@/services/session-service';

/**
 * Returns a logout function that:
 * 1. Clears auth state from the Zustand store / localStorage
 * 2. Wipes all React Query caches to prevent stale protected data
 * 3. Navigates to /login
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const storeLogout = useAuthStore((s) => s.logout);

  const logout = useCallback(async () => {
    try {
      await logoutSession();
    } catch {
      // Local logout should still proceed if the server call fails.
    } finally {
      storeLogout();
      queryClient.clear();
      router.push('/login');
    }
  }, [storeLogout, queryClient, router]);

  return logout;
}
