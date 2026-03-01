import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageShell — DS v1 page content wrapper.
 *
 * Provides consistent horizontal padding and top spacing.
 * Bottom clearance for BottomNav is already handled by (player)/layout.tsx.
 *
 * @example
 * ```tsx
 * <PageShell className="space-y-4 py-4">
 *   <Card>...</Card>
 * </PageShell>
 * ```
 */
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn('px-4 pt-4 pb-6', className)}>
      {children}
    </div>
  );
}
