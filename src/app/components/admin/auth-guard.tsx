'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const isAuthed = Boolean(user?.userId);

  useEffect(() => {
    if (!hydrated) return;
    if (pathname === '/admin/login') return;
    if (!isAuthed) {
      router.replace('/admin/login');
    }
  }, [hydrated, isAuthed, pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!hydrated || (!isAuthed && pathname !== '/admin/login')) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="animate-pulse text-sm font-medium text-slate-400">Verificando sesion...</p>
      </div>
    );
  }

  return <>{children}</>;
}
