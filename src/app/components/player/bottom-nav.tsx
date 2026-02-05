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
    { name: 'Reservar', href: '/', icon: PlusCircle, highlight: true }, // Quick action
    { name: 'Perfil', href: '/player/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-20">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href) && tab.href !== '/';

          if (tab.highlight) {
            return (
              <Link key={tab.name} href={tab.href} className="relative -top-6">
                <div className="h-16 w-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all active:scale-95 hover:shadow-xl">
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
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors min-h-[44px]",
                isActive ? "text-emerald-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon size={22} className={cn(isActive && "fill-current")} />
              <span className="text-[11px] font-medium leading-tight">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}