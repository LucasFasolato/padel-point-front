'use client';

import { Button } from '@/app/components/ui/button';
import { CategoryBadge } from '@/app/components/competitive/category-badge';
import type { Category } from '@/types/competitive';

interface StepSuccessProps {
  category: Category;
  displayName: string;
  onGoToRanking: () => void;
  onGoToChallenge: () => void;
  onGoToHub: () => void;
}

export function StepSuccess({
  category,
  displayName,
  onGoToRanking,
  onGoToChallenge,
  onGoToHub,
}: StepSuccessProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-6 pt-12 pb-10 text-white text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 animate-scale-in">
          <span className="text-4xl">🎉</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">
          ¡Perfil activado, {displayName}!
        </h1>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="text-emerald-100 text-sm">Tu categoría:</span>
          <CategoryBadge category={category} size="lg" />
        </div>
      </div>

      {/* CTAs */}
      <div className="flex-1 px-6 py-8 space-y-6">
        <p className="text-center text-slate-600 text-sm">
          Ya estás en el ranking. ¿Qué querés hacer primero?
        </p>

        <div className="space-y-3">
          <Button size="lg" fullWidth onClick={onGoToChallenge}>
            Desafiar un jugador
          </Button>
          <Button size="lg" fullWidth variant="outline" onClick={onGoToRanking}>
            Ver el ranking
          </Button>
          <Button size="lg" fullWidth variant="ghost" onClick={onGoToHub}>
            Ir a mi perfil competitivo
          </Button>
        </div>
      </div>
    </div>
  );
}
