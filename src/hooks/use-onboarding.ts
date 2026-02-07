import { useMutation, useQueryClient } from '@tanstack/react-query';
import { competitiveService } from '@/services/competitive-service';
import { useOnboardingStore } from '@/store/onboarding-store';
import type { OnboardingData } from '@/types/competitive';
import type { PlayerGoal, PlayFrequency } from '@/store/onboarding-store';
import type { Category } from '@/types/competitive';

// Re-export error utilities so consumers can import from a single module
export { parseOnboardingError, CATEGORY_LOCKED_CODE } from '@/lib/onboarding-utils';

export interface OnboardingSubmitPayload {
  category: Category;
  goal: PlayerGoal;
  frequency: PlayFrequency;
}

/**
 * Completes the onboarding flow by sending all fields atomically via
 * PUT /competitive/onboarding.
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const { markCompleted, reset } = useOnboardingStore();

  return useMutation<OnboardingData, unknown, OnboardingSubmitPayload>({
    mutationFn: async (payload) => {
      return competitiveService.putOnboarding({
        category: payload.category,
        goal: payload.goal,
        frequency: payload.frequency,
      });
    },
    onSuccess: () => {
      markCompleted();
      queryClient.invalidateQueries({ queryKey: ['competitive', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['competitive', 'onboarding'] });
      setTimeout(() => reset(), 5000);
    },
  });
}
