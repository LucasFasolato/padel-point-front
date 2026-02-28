'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart2, Users, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { name: 'Inicio', href: '/competitive', icon: Home },
  { name: 'Ranking', href: '/competitive/rankings', icon: BarChart2 },
  { name: 'Ligas', href: '/leagues', icon: Users },
  { name: 'Perfil', href: '/me/profile', icon: UserCircle },
] as const;

/**
 * BottomNav — Competitive v1 mobile navigation (4 tabs).
 *
 * Fixed at the bottom of the viewport with iOS safe-area support.
 * All tap targets meet the 44px minimum.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex h-14 max-w-md items-stretch">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + '/');

          return (
            <Link
              key={tab.name}
              href={tab.href}
              aria-label={tab.name}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
                'min-h-[44px]',
                isActive
                  ? 'text-[#0E7C66]'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium leading-none">{tab.name}</span>

              {/* Active indicator pill */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute bottom-0 left-1/2 h-0.5 w-7 -translate-x-1/2 rounded-full bg-[#0E7C66]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
