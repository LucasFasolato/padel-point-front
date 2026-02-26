'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Home page — canonical route for "/".
 *
 * Behaviour:
 * - Authenticated (hydrated + user set): silently redirect to /competitive.
 * - Not authenticated: show minimal DS v1 landing with Login / Register CTAs.
 *
 * SSR-safe: no window/document access during render; redirect fires only in
 * a client-side useEffect after auth hydration completes.
 */
export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  // Once AuthBootstrap resolves the session, redirect authenticated users.
  useEffect(() => {
    if (hydrated && user?.userId) {
      router.replace('/competitive');
    }
  }, [hydrated, user, router]);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      {/* ── Center content ── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        {/* Brand mark */}
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0E7C66] text-white shadow-sm">
            <span className="text-3xl font-black leading-none">P</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Padel<span className="text-[#0E7C66]">Point</span>
          </h1>
          <p className="mx-auto mt-2 max-w-[22ch] text-sm leading-relaxed text-slate-500">
            Pádel competitivo. ELO, ligas y desafíos entre amigos.
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0E7C66] text-sm font-semibold text-white transition-colors hover:bg-[#065F46] focus:outline-none focus:ring-2 focus:ring-[#0E7C66]/30 active:scale-[0.98]"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300/40 active:scale-[0.98]"
          >
            Crear cuenta
          </Link>
        </div>
      </main>

      {/* ── Minimal footer ── */}
      <footer className="pb-8 text-center">
        <p className="text-[11px] text-slate-400">
          © {new Date().getFullYear()} PadelPoint
        </p>
      </footer>
    </div>
  );
}
