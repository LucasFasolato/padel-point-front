import { BottomNav } from '@/app/components/player/bottom-nav';

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg pb-20"> {/* Padding bottom for Nav */}
      <main className="mx-auto min-h-screen max-w-md bg-surface sm:border-x sm:border-border sm:shadow-xl">
        {children}
      </main>
      <div className="mx-auto max-w-md">
        <BottomNav />
      </div>
    </div>
  );
}
