'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, User, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Inicio', href: '/player/home', icon: Home },
    { name: 'Mis Partidos', href: '/player/matches', icon: CalendarDays },
    { name: 'Reservar', href: '/', icon: PlusCircle, highlight: true },
    { name: 'Perfil', href: '/player/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.06)]">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href) && tab.href !== '/';

          if (tab.highlight) {
            return (
              <Link key={tab.name} href={tab.href} className="relative -top-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-950 text-white shadow-lg shadow-black/30 transition-transform active:scale-95">
                  <tab.icon size={24} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center space-y-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-textMuted hover:text-text"
              )}
            >
              <tab.icon size={22} className={cn(isActive && "fill-current")} />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
