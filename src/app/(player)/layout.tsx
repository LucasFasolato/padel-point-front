import { BottomNav } from '@/app/components/player/bottom-nav';
import { NotificationProvider } from '@/app/components/notifications/notification-provider';
import { Providers } from '@/app/providers';

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <NotificationProvider />
      {/* Outer shell: light gray background visible at tablet+ widths */}
      <div className="min-h-dvh bg-[#F7F8FA]">
        {/*
         * Mobile app container: max 448px, centered, white bg.
         * Bottom padding reserves space for the fixed BottomNav (56px)
         * plus the iOS home-indicator safe-area.
         */}
        <main
          className="mx-auto max-w-md min-h-dvh bg-white sm:border-x sm:border-slate-100 sm:shadow-xl"
          style={{ paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {children}
        </main>
      </div>
      {/* BottomNav is fixed-position so DOM placement doesn't matter */}
      <BottomNav />
    </Providers>
  );
}