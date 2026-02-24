'use client';

import { useQuery } from '@tanstack/react-query';
import { PlayerService } from '@/services/player-service';

export function useFavoriteIds() {
  return useQuery({
    queryKey: ['favorites', 'ids'] as const,
    queryFn: () => PlayerService.getFavoriteIds(),
    staleTime: 60_000,
  });
}
