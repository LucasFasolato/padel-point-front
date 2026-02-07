'use client';

import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useAuthStore } from '@/store/auth-store';
import { useCompleteOnboarding } from '@/hooks/use-onboarding';
import { useCompetitiveProfile } from '@/hooks/use-competitive-profile';
import { canAdvanceFromStep, TOTAL_STEPS } from '@/lib/onboarding-utils';
import { ProgressBar } from './progress-bar';
import { StepWelcome } from './step-welcome';
import { StepCategory } from './step-category';
import { StepGoals } from './step-goals';
import { StepConfirm } from './step-confirm';
import { StepSuccess } from './step-success';
import { Skeleton } from '@/app/components/ui/skeleton';
import { useEffect } from 'react';
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

  const { data: existingProfile, isLoading: loadingProfile } = useCompetitiveProfile();
  const completeMutation = useCompleteOnboarding();

  // If user already has a profile, redirect to competitive hub
  useEffect(() => {
    if (existingProfile && !completed) {
      router.replace('/competitive');
    }
  }, [existingProfile, completed, router]);

  if (loadingProfile) {
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
    const profileData = completeMutation.data;
    return (
      <StepSuccess
        category={profileData?.category ?? (category as Category)}
        displayName={profileData?.displayName ?? user?.email ?? 'Jugador'}
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
    if (category === null) return;
    completeMutation.mutate(category);
  };

  const errorMessage = completeMutation.isError
    ? 'No pudimos activar tu perfil. Revisá tu conexión e intentá de nuevo.'
    : null;

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
          onConfirm={handleConfirm}
          onBack={goBack}
        />
      )}
    </div>
  );
}
