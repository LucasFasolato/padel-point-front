'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthIdentities } from '@/services/auth-identities-service';

export function useAuthIdentities() {
  return useQuery({
    queryKey: ['auth-identities'],
    queryFn: getAuthIdentities,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
