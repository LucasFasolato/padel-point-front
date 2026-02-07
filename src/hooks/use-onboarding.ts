import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competitiveService } from '@/services/competitive-service';
import type { Category } from '@/types/competitive';
import { useOnboardingStore } from '@/store/onboarding-store';

/**
 * Completes the onboarding flow by initializing the competitive profile
 * with the selected category and persisting preferences.
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const { markCompleted, reset } = useOnboardingStore();

  return useMutation({
    mutationFn: async (category: Category) => {
      return competitiveService.initCategory(category);
    },
    onSuccess: () => {
      markCompleted();
      queryClient.invalidateQueries({ queryKey: ['competitive', 'profile'] });
      // Small delay before clearing store so the success step renders
      setTimeout(() => reset(), 5000);
    },
  });
}
