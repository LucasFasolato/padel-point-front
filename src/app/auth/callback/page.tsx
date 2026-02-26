'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { getMe } from '@/services/session-service';
import { getPostAuthDestination } from '@/lib/auth-redirect';
import { AuthCard } from '@/app/components/auth/auth-card';

export default function AuthCallbackPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    const bootstrapOAuthSession = async () => {
      try {
        const user = await getMe();
        if (!active) return;
        setUser(user);
        const dest = await getPostAuthDestination();
        if (!active) return;
        router.replace(dest);
      } catch {
        if (!active) return;
        setError(true);
        router.replace('/login?error=oauth');
      }
    };

    void bootstrapOAuthSession();

    return () => {
      active = false;
    };
  }, [router, setUser]);

  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center">
        {!error ? (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0E7C66]/10 text-[#0E7C66]">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Conectando tu cuenta...</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Estamos confirmando tu sesión para ingresar.
            </p>
          </>
        ) : (
          <>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">No pudimos conectar tu cuenta</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Intentá nuevamente desde el inicio de sesión.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0E7C66] text-sm font-semibold text-white transition-all hover:bg-[#0A6657] hover:shadow-md"
            >
              Ir a iniciar sesión
            </Link>
          </>
        )}
      </div>
    </AuthCard>
  );
}
