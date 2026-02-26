'use client';

import React, { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { authService } from '@/services/auth-service';
import { toastManager } from '@/lib/toast';
import { useAuthStore } from '@/store/auth-store';
import { getPostAuthDestination } from '@/lib/auth-redirect';
import { AuthCard, GoogleIcon } from '@/app/components/auth/auth-card';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  const errorParam = searchParams.get('error');
  const banner =
    errorParam === 'oauth'
      ? 'No pudimos conectar tu cuenta. Probá nuevamente.'
      : errorParam === 'session'
        ? 'Tu sesión expiró. Iniciá sesión otra vez.'
        : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await authService.login(email.trim(), password);
      if (controller.signal.aborted) return;

      setUser(res.user);
      const dest = await getPostAuthDestination();
      if (controller.signal.aborted) return;
      router.replace(dest);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401) {
          setError('Email o contraseña incorrectos.');
          return;
        }
        if (status === 403) {
          setError('Tu cuenta no tiene permisos para ingresar acá.');
          return;
        }
      }

      const message =
        err instanceof Error && err.message
          ? err.message
          : 'No pudimos iniciar sesión. Intentá nuevamente.';

      toastManager.error(message, { idempotencyKey: 'login-network-error' });
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      toastManager.error('Falta configurar NEXT_PUBLIC_API_URL para Google.', {
        idempotencyKey: 'login-google-missing-api-url',
      });
      return;
    }
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <AuthCard backHref="/">
      <h1 className="mb-1 text-center text-[22px] font-extrabold tracking-tight text-slate-900">
        Bienvenido de vuelta
      </h1>
      <p className="mb-7 text-center text-sm text-slate-500">Iniciá sesión para seguir jugando.</p>

      {banner && (
        <div className="mb-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-700">
          {banner}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Google — Primary CTA */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:shadow-sm"
      >
        <GoogleIcon />
        Continuar con Google
      </button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-xs font-medium text-slate-400">o con email</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      {/* Email form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="email"
              required
              placeholder="tuemail@mail.com"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0E7C66] focus:bg-white focus:ring-2 focus:ring-[#0E7C66]/10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Contraseña
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-slate-400 transition-colors hover:text-[#0E7C66]"
            >
              ¿La olvidaste?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="password"
              required
              placeholder="••••••••"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0E7C66] focus:bg-white focus:ring-2 focus:ring-[#0E7C66]/10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0E7C66] text-sm font-semibold text-white transition-all hover:bg-[#0A6657] hover:shadow-md active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              Ingresar <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        ¿No tenés cuenta?{' '}
        <Link
          href="/register"
          className="font-semibold text-[#0E7C66] transition-colors hover:text-[#0A6657]"
        >
          Registrate
        </Link>
      </p>
    </AuthCard>
  );
}

function LoginFallback() {
  return (
    <AuthCard>
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="animate-spin text-[#0E7C66]" size={28} />
      </div>
    </AuthCard>
  );
}
