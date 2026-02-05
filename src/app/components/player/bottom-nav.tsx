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
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href) && tab.href !== '/';
          
          if (tab.highlight) {
            return (
              <Link key={tab.name} href={tab.href} className="relative -top-5">
                <div className="h-14 w-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/30 transition-transform active:scale-95">
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
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
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