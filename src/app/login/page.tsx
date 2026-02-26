'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { authService } from '@/services/auth-service';
import { toastManager } from '@/lib/toast';
import { useAuthStore } from '@/store/auth-store';

type LoginForm = {
  email: string;
  password: string;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');

    if (errorParam === 'oauth') {
      setBanner('No pudimos conectar tu cuenta. Proba nuevamente.');
    } else if (errorParam === 'session') {
      setBanner('Tu sesion expiro. Inicia sesion otra vez.');
    } else {
      setBanner('');
    }

    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await authService.login(form.email.trim(), form.password);
      if (controller.signal.aborted) return;

      setUser(res.user);
      router.replace('/');
    } catch (err: unknown) {
      if (controller.signal.aborted) return;

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const status = (err as { response?: { status?: number } }).response?.status;
        if (status === 401) {
          setError('Email o contrasena incorrectos.');
          return;
        }
        if (status === 403) {
          setError('Tu cuenta no tiene permisos para ingresar aca.');
          return;
        }
      }

      const message =
        err instanceof Error && err.message
          ? err.message
          : 'No pudimos iniciar sesion. Intenta nuevamente.';

      toastManager.error(message, {
        idempotencyKey: 'login-network-error',
      });
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-50/50 px-4 py-12">
      {/* Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <span className="text-4xl leading-none select-none">🎾</span>
        <span className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase">
          PadelPoint
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl bg-white px-8 py-10 shadow-xl shadow-slate-200/80 ring-1 ring-slate-100">
        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bienvenido de vuelta</h1>
          <p className="mt-1.5 text-sm text-slate-500">Iniciá sesión para seguir jugando.</p>
        </div>

        {/* Banners */}
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
          className="group flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0 active:shadow-sm"
        >
          <GoogleIcon />
          Continuar con Google
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-100" />
          <span className="text-xs font-medium text-slate-400">o con email</span>
          <div className="h-px flex-1 bg-slate-100" />
        </div>

        {/* Email form — Secondary */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                size={16}
              />
              <input
                type="email"
                required
                placeholder="tuemail@mail.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                className="text-xs font-medium text-slate-400 transition-colors hover:text-emerald-600"
              >
                ¿La olvidaste?
              </Link>
            </div>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"
                size={16}
              />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-150 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* Register */}
        <p className="mt-7 text-center text-sm text-slate-500">
          ¿No tenés cuenta?{' '}
          <Link
            href="/register"
            className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
          >
            Registrate
          </Link>
        </p>

        {/* Guest */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-3 w-full text-center text-xs font-medium text-slate-400 transition-colors hover:text-slate-600"
        >
          Continuar como invitado →
        </button>
      </div>
    </div>
  );
}
