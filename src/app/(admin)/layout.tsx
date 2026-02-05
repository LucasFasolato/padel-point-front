'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useClubStore } from '@/store/club-store';
import {
  LayoutDashboard,
  CalendarDays,
  Settings,
  LogOut,
  Users,
  Map,
  CreditCard,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AuthGuard from '@/app/components/admin/auth-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page doesn't need the Sidebar layout
  if (pathname === '/admin/login') {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-bg text-text">
        <Sidebar />
        <main className="ml-0 w-full p-8 transition-all md:ml-64">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { activeClub } = useClubStore();

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <aside className="fixed left-0 top-0 z-20 hidden h-full w-64 bg-brand-950 text-white shadow-xl md:block">
      <div className="border-b border-white/10 p-6">
        <h1 className="text-xl font-bold tracking-tight">PadelPoint Admin</h1>
        <p className="mt-1 truncate text-xs text-white/60">{user?.email}</p>
      </div>

      <nav className="space-y-1 p-4">
        <NavItem
          href="/admin/dashboard"
          icon={<LayoutDashboard size={20} />}
          label="Overview"
          active={pathname === '/admin/dashboard'}
        />

        {activeClub ? (
          <>
            <NavItem
              href="/admin/bookings"
              icon={<CalendarDays size={20} />}
              label="Bookings"
              active={pathname.includes('bookings')}
            />
            <NavItem
              href="/admin/payments"
              icon={<CreditCard size={20} />}
              label="Payments"
              active={pathname.includes('payments')}
            />
            <NavItem
              href="/admin/courts"
              icon={<Map size={20} />}
              label="Courts"
              active={pathname.includes('courts')}
            />
            <NavItem
              href="/admin/members"
              icon={<Users size={20} />}
              label="Members"
              active={pathname.includes('members')}
            />
            <NavItem
              href="/admin/metrics"
              icon={<BarChart3 size={20} />}
              label="Metrics"
              active={pathname.includes('metrics')}
            />
            <NavItem
              href="/admin/availability"
              icon={<Calendar size={20} />}
              label="Schedule"
              active={pathname.includes('availability')}
            />
            <NavItem
              href="/admin/settings"
              icon={<Settings size={20} />}
              label="Settings"
              active={pathname.includes('settings')}
            />
          </>
        ) : (
          <div className="px-4 py-8 text-center text-white/60">
            <p className="text-xs">
              Select a club in Overview to see more options.
            </p>
          </div>
        )}
      </nav>

      <div className="absolute bottom-0 w-full border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl p-3 transition-colors',
            'text-white/70 hover:bg-white/10 hover:text-white',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-brand-950'
          )}
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-brand-950',
        active
          ? 'bg-primary text-primary-foreground shadow-lg shadow-black/20'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
}
