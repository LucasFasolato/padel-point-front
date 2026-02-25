'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { getMe } from '@/services/session-service';

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
        router.replace('/');
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        {!error ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Conectando tu cuenta...</h1>
            <p className="mt-2 text-sm text-slate-500">
              Estamos confirmando tu sesion para ingresar.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">No pudimos conectar tu cuenta</h1>
            <p className="mt-2 text-sm text-slate-500">
              Intenta nuevamente desde el inicio de sesion.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ir a login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
