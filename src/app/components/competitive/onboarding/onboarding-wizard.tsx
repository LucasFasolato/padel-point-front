'use client';

import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useAuthStore } from '@/store/auth-store';
import {
  useCompleteOnboarding,
  parseOnboardingError,
  CATEGORY_LOCKED_CODE,
} from '@/hooks/use-onboarding';
import { useOnboardingState } from '@/hooks/use-competitive-profile';
import { canAdvanceFromStep, TOTAL_STEPS } from '@/lib/onboarding-utils';
import { ProgressBar } from './progress-bar';
import { StepWelcome } from './step-welcome';
import { StepCategory } from './step-category';
import { StepGoals } from './step-goals';
import { StepConfirm } from './step-confirm';
import { StepSuccess } from './step-success';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useEffect, useState } from 'react';
import type { Category } from '@/types/competitive';

export function OnboardingWizard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const {
    currentStep,
    category,
    goal,
    frequency,
    completed,
    setStep,
    setCategory,
    setGoal,
    setFrequency,
  } = useOnboardingStore();

  const { data: serverOnboarding, isLoading: loadingOnboarding } = useOnboardingState();
  const completeMutation = useCompleteOnboarding();

  // Whether the server told us category is locked
  const [categoryLocked, setCategoryLocked] = useState(false);

  // Server reconciliation: if server says onboardingComplete, redirect
  useEffect(() => {
    if (!serverOnboarding) return;

    if (serverOnboarding.onboardingComplete && !completed) {
      router.replace('/competitive');
      return;
    }

    // Sync category-locked from server
    if (serverOnboarding.categoryLocked) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCategoryLocked(true);
    }
  }, [serverOnboarding, completed, router]);

  if (loadingOnboarding) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Show success screen after completing
  if (completed || completeMutation.isSuccess) {
    const result = completeMutation.data;
    return (
      <StepSuccess
        category={result?.category ?? (category as Category)}
        displayName={user?.email ?? 'Jugador'}
        onGoToChallenge={() => router.push('/competitive/challenges/new')}
        onGoToRanking={() => router.push('/ranking')}
        onGoToHub={() => router.push('/competitive')}
      />
    );
  }

  const goNext = () => {
    if (canAdvanceFromStep(currentStep, { category, goal, frequency })) {
      setStep(Math.min(currentStep + 1, TOTAL_STEPS - 1));
    }
  };

  const goBack = () => {
    setStep(Math.max(currentStep - 1, 0));
  };

  const handleConfirm = () => {
    if (category === null || goal === null || frequency === null) return;
    completeMutation.mutate({ category, goal, frequency });
  };

  // Parse error into user-friendly message and detect category lock
  let errorMessage: string | null = null;
  let isCategoryLockedError = false;
  if (completeMutation.isError) {
    const parsed = parseOnboardingError(completeMutation.error);
    errorMessage = parsed.message;
    isCategoryLockedError = parsed.code === CATEGORY_LOCKED_CODE;
  }

  // Resolved category lock state: from server or from failed mutation
  const effectiveCategoryLocked = categoryLocked || isCategoryLockedError;

  return (
    <div>
      <ProgressBar currentStep={currentStep} />

      {currentStep === 0 && <StepWelcome onNext={goNext} />}

      {currentStep === 1 && (
        <StepCategory
          selected={category}
          onSelect={setCategory}
          onNext={goNext}
          onBack={goBack}
          locked={effectiveCategoryLocked}
          lockedCategory={serverOnboarding?.category ?? null}
        />
      )}

      {currentStep === 2 && (
        <StepGoals
          selectedGoal={goal}
          selectedFrequency={frequency}
          onSelectGoal={setGoal}
          onSelectFrequency={setFrequency}
          onNext={goNext}
          onBack={goBack}
        />
      )}

      {currentStep === 3 && category && goal && frequency && (
        <StepConfirm
          category={category}
          goal={goal}
          frequency={frequency}
          isSubmitting={completeMutation.isPending}
          error={errorMessage}
          categoryLocked={effectiveCategoryLocked}
          onConfirm={handleConfirm}
          onBack={goBack}
        />
      )}
    </div>
  );
}
