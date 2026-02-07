import { Suspense } from 'react';
import { OnboardingWizard } from '@/app/components/competitive/onboarding/onboarding-wizard';
import { Skeleton } from '@/app/components/ui/skeleton';

function OnboardingFallback() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingWizard />
    </Suspense>
  );
}
