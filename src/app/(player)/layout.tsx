import { BottomNav } from '@/app/components/player/bottom-nav';
import { Providers } from '@/app/providers';

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-slate-50 pb-20">
        <main className="max-w-md mx-auto min-h-screen bg-white sm:shadow-xl sm:border-x sm:border-slate-100">
          {children}
        </main>
        <div className="max-w-md mx-auto">
          <BottomNav />
        </div>
      </div>
    </Providers>
  );
}