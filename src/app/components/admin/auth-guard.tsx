'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuthStore();

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  // ✅ Setear header sin duplicar interceptores
  useEffect(() => {
    if (!isHydrated) return;

    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [isHydrated, token]);

  useEffect(() => {
    if (!isHydrated) return;
    if (pathname === '/admin/login') return;

    if (!token) router.replace('/admin/login');
  }, [isHydrated, token, pathname, router]);

  if (pathname === '/admin/login') return <>{children}</>;

  if (!isHydrated || (!token && pathname !== '/admin/login')) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-bg gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-textMuted animate-pulse">
          Verificando sesión...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
