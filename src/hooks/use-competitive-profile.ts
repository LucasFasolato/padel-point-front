import { useQuery } from '@tanstack/react-query';
import { competitiveService } from '@/services/competitive-service';

export function useCompetitiveProfile() {
  return useQuery({
    queryKey: ['competitive', 'profile'],
    queryFn: () => competitiveService.getMyProfile(),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useEloHistory(limit: number = 30) {
  return useQuery({
    queryKey: ['competitive', 'elo-history', limit],
    queryFn: () => competitiveService.getEloHistory(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRanking(limit: number = 50) {
  return useQuery({
    queryKey: ['competitive', 'ranking', limit],
    queryFn: () => competitiveService.getRanking(limit),
    staleTime: 1000 * 60 * 2,
  });
}