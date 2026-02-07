'use client';

import { cn } from '@/lib/utils';
import { TOTAL_STEPS } from '@/lib/onboarding-utils';

interface ProgressBarProps {
  currentStep: number;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="px-4 pt-4 pb-2" role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">
          Paso {currentStep + 1} de {TOTAL_STEPS}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200">
        <div
          className={cn(
            'h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
