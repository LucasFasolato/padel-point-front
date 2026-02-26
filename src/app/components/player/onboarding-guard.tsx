'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import api from '@/lib/api';

const ONBOARDING_PATH = '/competitive/onboarding';

/**
 * Routes that require competitive access (cityId must be set).
 * /me/profile, /me/reservations, etc. are intentionally NOT guarded.
 */
const GUARDED_PREFIXES = [
  '/competitive',
  '/ranking',
  '/leagues',
  '/matches',
  '/competitive-matches',
  '/notifications',
] as const;

/**
 * OnboardingGuard — mounted in the (player) layout.
 *
 * If the backend returns 409 CITY_REQUIRED from GET /competitive/me, the user
 * is redirected to /competitive/onboarding on any competitive-gated route.
 *
 * Uses the same React Query key as useCompetitiveProfile so the response is
 * cached and shared across the page tree.
 */
export function OnboardingGuard() {
  const router = useRouter();
  const pathname = usePathname();

  const isOnboarding =
    pathname === ONBOARDING_PATH || pathname.startsWith(ONBOARDING_PATH + '/');

  const isGuarded =
    !isOnboarding &&
    GUARDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));

  const { isError, error } = useQuery({
    queryKey: ['competitive', 'profile'],
    queryFn: () => api.get('/competitive/me').then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, err) => {
      // Never retry CITY_REQUIRED — it won't change without a page action
      if (axios.isAxiosError(err) && err.response?.status === 409) return false;
      return failureCount < 2;
    },
    enabled: isGuarded,
  });

  useEffect(() => {
    if (!isGuarded || !isError || !error) return;

    if (axios.isAxiosError(error) && error.response?.status === 409) {
      const code = (error.response.data as Record<string, unknown> | undefined)?.code;
      if (code === 'CITY_REQUIRED') {
        router.replace(ONBOARDING_PATH);
      }
    }
  }, [isError, error, isGuarded, router]);

  return null;
}
