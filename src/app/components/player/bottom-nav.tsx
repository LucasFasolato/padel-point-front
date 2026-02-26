'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Users, Bell, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnreadCount } from '@/hooks/use-notifications';

export function BottomNav() {
  const pathname = usePathname();
  const { data: unreadCount } = useUnreadCount();
  const hasUnread = (unreadCount ?? 0) > 0;

  const tabs = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Competitivo', href: '/competitive', icon: Trophy },
    { name: 'Ligas', href: '/leagues', icon: Users, highlight: true },
    { name: 'Alertas', href: '/notifications', icon: Bell, badge: hasUnread },
    { name: 'Perfil', href: '/me/profile', icon: UserCircle },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      <div className="flex h-20 items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            tab.href !== '/'
              ? pathname.startsWith(tab.href)
              : pathname === '/' && !tab.highlight;

          if (tab.highlight) {
            return (
              <Link key={tab.name} href={tab.href} className="relative -top-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0E7C66] text-white shadow-lg shadow-[#0E7C66]/25 transition-all hover:shadow-xl hover:bg-[#065F46] active:scale-95">
                  <tab.icon size={24} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.name}
              href={tab.href}
              aria-label={
                tab.badge
                  ? `${tab.name} — tienes notificaciones sin leer`
                  : tab.name
              }
              className={cn(
                'relative flex h-full min-h-[44px] w-full flex-col items-center justify-center gap-1 transition-colors',
                isActive ? 'text-[#0E7C66]' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <div className="relative">
                <tab.icon size={22} className={cn(isActive && 'fill-current')} />
                {tab.badge && (
                  <span
                    className="pointer-events-none absolute -right-1.5 -top-1 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className="text-[11px] font-medium leading-tight">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
