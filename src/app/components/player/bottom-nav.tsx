'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, User, PlusCircle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Partidos', href: '/matches', icon: CalendarDays },
    { name: 'Reservar', href: '/', icon: PlusCircle, highlight: true },
    { name: 'Competitive', href: '/competitive', icon: Trophy },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <div className="flex h-20 items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            tab.href !== '/'
              ? pathname.startsWith(tab.href)
              : pathname === '/' && !tab.highlight;

          if (tab.highlight) {
            return (
              <Link key={tab.name} href={tab.href} className="relative -top-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition-all hover:shadow-xl active:scale-95">
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
                'flex h-full min-h-[44px] w-full flex-col items-center justify-center gap-1 transition-colors',
                isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <tab.icon size={22} className={cn(isActive && 'fill-current')} />
              <span className="text-[11px] font-medium leading-tight">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}