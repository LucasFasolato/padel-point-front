'use client';

import Link from 'next/link';
import { MapPin, Bell, Shield, Sliders } from 'lucide-react';
import type { ReactNode } from 'react';

interface QuickActionCellProps {
  icon: ReactNode;
  label: string;
  href: string;
  badge?: number;
}

function QuickActionCell({ icon, label, href, badge }: QuickActionCellProps) {
  return (
    <Link
      href={href}
      className="relative flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-4 text-center transition-all hover:border-slate-200 hover:bg-slate-50 active:scale-[0.98]"
    >
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#0E7C66]">
        {icon}
        {!!badge && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-xs font-semibold text-slate-700">{label}</span>
    </Link>
  );
}

interface AccountQuickActionsProps {
  hasLocation?: boolean;
  unreadCount?: number;
}

export function AccountQuickActions({ hasLocation, unreadCount }: AccountQuickActionsProps) {
  const actions: QuickActionCellProps[] = [
    {
      icon: <MapPin size={20} />,
      label: 'Ubicación',
      href: hasLocation ? '/me/profile#location' : '/competitive/onboarding',
    },
    {
      icon: <Bell size={20} />,
      label: 'Notificaciones',
      href: '/me/inbox',
      badge: unreadCount,
    },
    {
      icon: <Shield size={20} />,
      label: 'Seguridad',
      href: '/me/security',
    },
    {
      icon: <Sliders size={20} />,
      label: 'Preferencias',
      href: '/me/preferences',
    },
  ];

  return (
    <div>
      <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Acciones rápidas
      </p>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <QuickActionCell key={action.label} {...action} />
        ))}
      </div>
    </div>
  );
}
