'use client';

import { Trophy, Swords } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export function CompetitiveQuickLinks() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => router.push('/ranking')}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/15"
      >
        <Trophy className="h-4 w-4" />
        Ver ranking
      </button>

      <button
        type="button"
        onClick={() =>
          router.push(token ? '/competitive' : '/login?redirect=/competitive')
        }
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
      >
        <Swords className="h-4 w-4" />
        Competitivo
      </button>
    </div>
  );
}
