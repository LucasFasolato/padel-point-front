import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category } from '@/types/competitive';

export type PlayerGoal = 'improve' | 'compete' | 'socialize';
export type PlayFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'occasional';

interface OnboardingState {
  /** Current step (0-indexed). null = not started */
  currentStep: number;
  /** Selected initial category */
  category: Category | null;
  /** Primary player goal */
  goal: PlayerGoal | null;
  /** Expected weekly playing frequency */
  frequency: PlayFrequency | null;
  /** Whether onboarding was completed */
  completed: boolean;

  setStep: (step: number) => void;
  setCategory: (category: Category) => void;
  setGoal: (goal: PlayerGoal) => void;
  setFrequency: (frequency: PlayFrequency) => void;
  markCompleted: () => void;
  reset: () => void;
}

const initialState = {
  currentStep: 0,
  category: null as Category | null,
  goal: null as PlayerGoal | null,
  frequency: null as PlayFrequency | null,
  completed: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (step) => set({ currentStep: step }),
      setCategory: (category) => set({ category }),
      setGoal: (goal) => set({ goal }),
      setFrequency: (frequency) => set({ frequency }),
      markCompleted: () => set({ completed: true }),
      reset: () => set(initialState),
    }),
    {
      name: 'padel-onboarding',
    }
  )
);
