'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Lock, Mail, UserCircle2 } from 'lucide-react';
import { authService } from '@/services/auth-service';
import { toastManager } from '@/lib/toast';
import { useAuthStore } from '@/store/auth-store';

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
        <div className="bg-slate-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <UserCircle2 size={30} />
          </div>
          <h1 className="text-2xl font-bold text-white">Iniciar sesion</h1>
          <p className="mt-2 text-sm text-slate-300">
            Inicia sesion para ver tus reservas y guardar tus datos.
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="email"
                  required
                  placeholder="tuemail@mail.com"
                  className="w-full rounded-xl border border-slate-200 p-3 pl-10 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="block text-sm font-medium text-slate-700">Contrasena</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Olvide mi contrasena
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  required
                  placeholder="********"
                  className="w-full rounded-xl border border-slate-200 p-3 pl-10 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Entrar <ArrowRight size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white py-3.5 font-bold text-slate-700 transition-all hover:bg-slate-50"
            >
              Continuar con Google
            </button>
          </form>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Continuar como invitado
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-slate-500">
            No tenes cuenta?{' '}
            <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Registrate
            </Link>
          </div>

          <div className="mt-3 text-center text-sm text-slate-400">
            Sos dueno?{' '}
            <Link href="/admin/login" className="font-semibold text-slate-600 hover:text-blue-600">
              Entra al panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
