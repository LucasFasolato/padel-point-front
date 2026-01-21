'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useClubStore } from '@/store/club-store';
import { LayoutDashboard, CalendarDays, Settings, LogOut, Users, Map } from 'lucide-react';
import { cn } from '@/lib/utils';
import AuthGuard from '@/app/components/admin/auth-guard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Logic is now handled by AuthGuard!
  
  const pathname = usePathname();
  
  // Login page doesn't need the Sidebar layout
  if (pathname === '/admin/login') {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="ml-0 md:ml-64 w-full p-8 transition-all">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

// Extract Sidebar to keep the main component clean
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
        <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white shadow-xl z-20 hidden md:block">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold tracking-tight">PadelPoint Admin</h1>
                <p className="text-xs text-slate-400 mt-1 truncate">{user?.email}</p>
            </div>
            
            <nav className="p-4 space-y-1">
                <NavItem href="/admin/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" active={pathname === '/admin/dashboard'} />
                
                {activeClub ? (
                    <>
                        <NavItem href="/admin/bookings" icon={<CalendarDays size={20} />} label="Bookings" active={pathname.includes('bookings')} />
                        <NavItem href="/admin/courts" icon={<Map size={20} />} label="Courts" active={pathname.includes('courts')} />
                        <NavItem href="/admin/members" icon={<Users size={20} />} label="Members" active={pathname.includes('members')} />
                        <NavItem href="/admin/settings" icon={<Settings size={20} />} label="Settings" active={pathname.includes('settings')} />
                    </>
                ) : (
                    <div className="px-4 py-8 text-center opacity-50">
                        <p className="text-xs">Select a club in Overview to see more options.</p>
                    </div>
                )}
            </nav>

            <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl p-3 text-red-400 hover:bg-slate-800 transition-colors">
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link href={href} className={cn("flex items-center gap-3 rounded-xl px-4 py-3 transition-colors", active ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-white")}>
      {icon}<span className="font-medium">{label}</span>
    </Link>
  );
}