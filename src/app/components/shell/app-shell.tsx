import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  /** Page content */
  children: ReactNode;
  /** Sticky TopBar rendered above the scrollable area */
  topBar?: ReactNode;
  /** Extra classes applied to the scrollable content wrapper */
  className?: string;
}

/**
 * AppShell — mobile-first content wrapper for Competitive v1 screens.
 *
 * Provides:
 * - Optional sticky TopBar slot
 * - Content area with automatic bottom clearance for the fixed BottomNav
 * - iOS safe-area inset support (env(safe-area-inset-*))
 *
 * @example
 * ```tsx
 * <AppShell topBar={<TopBar title="Mis partidos" back="/competitive" />}>
 *   <YourContent />
 * </AppShell>
 * ```
 */
export function AppShell({ children, topBar, className }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      {topBar}
      <div
        className={cn(
          'flex-1',
          // Reserve space for fixed BottomNav (56px) + iOS bottom safe-area
          'pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
