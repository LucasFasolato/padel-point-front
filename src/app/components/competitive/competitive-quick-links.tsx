'use client';

import { Trophy, Swords, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export function CompetitiveQuickLinks() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthed = Boolean(user?.userId);

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => router.push('/ranking')}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition-colors"
      >
        <Trophy className="h-4 w-4" />
        Ranking
      </button>

      <button
        type="button"
        onClick={() => router.push(isAuthed ? '/competitive' : '/login')}
        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors"
      >
        <Swords className="h-4 w-4" />
        Competitivo
      </button>

      <button
        type="button"
        onClick={() => router.push(isAuthed ? '/leagues' : '/login')}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition-colors"
      >
        <Users className="h-4 w-4" />
        Ligas
      </button>
    </div>
  );
}
