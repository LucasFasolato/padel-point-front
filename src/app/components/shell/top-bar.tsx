'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TopBarProps {
  title: string;
  /**
   * Back navigation:
   * - string  → Link to that href
   * - true    → router.back()
   * - omitted → no back button (transparent spacer keeps title centered)
   */
  back?: string | true;
  /** Slot for right-side actions (icon buttons, ThemeToggle, etc.) */
  actions?: ReactNode;
  className?: string;
}

/**
 * TopBar — sticky page header for Competitive v1 shell.
 *
 * - Optional back button (href or router.back())
 * - Absolutely centered title regardless of left/right content
 * - 56px height, backdrop blur, subtle border
 * - All interactive elements meet the 44px tap target minimum
 *
 * @example
 * ```tsx
 * <TopBar title="Desafíos" back="/competitive" actions={<ThemeToggle />} />
 * ```
 */
export function TopBar({ title, back, actions, className }: TopBarProps) {
  const router = useRouter();

  const backEl =
    back === undefined ? (
      <span className="h-11 w-11" aria-hidden />
    ) : back === true ? (
      <button
        onClick={() => router.back()}
        aria-label="Volver"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/20"
      >
        <ChevronLeft size={22} />
      </button>
    ) : (
      <Link
        href={back}
        aria-label="Volver"
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/20"
      >
        <ChevronLeft size={22} />
      </Link>
    );

  return (
    <div
      className={cn(
        'sticky top-0 z-40',
        'border-b border-slate-100 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/85',
        // iOS notch: add top safe-area padding
        '[padding-top:env(safe-area-inset-top,0px)]',
        className
      )}
    >
      <div className="relative flex h-14 items-center justify-between px-3">
        {/* Left: back button or spacer */}
        {backEl}

        {/* Center: absolutely positioned so title is always perfectly centered */}
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-bold tracking-tight text-slate-900">
          {title}
        </span>

        {/* Right: actions or spacer */}
        <div className="flex items-center gap-1">
          {actions ?? <span className="h-11 w-11" aria-hidden />}
        </div>
      </div>
    </div>
  );
}
