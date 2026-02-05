'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Lock, Mail, UserCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { toastManager } from '@/lib/toast';
import { useAuthStore } from '@/store/auth-store';

type LoginForm = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

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
      const res = await api.post(
        '/auth/login-user',
        { email: form.email.trim(), password: form.password },
        { signal: controller.signal }
      );

      const token = res.data?.accessToken ?? res.data?.token;
      if (!token) {
        toastManager.error('No pudimos iniciar sesión. Intentá nuevamente.', {
          idempotencyKey: 'login-missing-token',
        });
        return;
      }

      const user =
        res.data.user || { userId: 'temp-id', email: form.email, role: 'USER' };
      setAuth(token, user);
      router.replace('/');
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

      toastManager.error('No pudimos iniciar sesión. Intentá nuevamente.', {
        idempotencyKey: 'login-network-error',
      });
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="bg-surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface2 text-primary">
            <UserCircle2 size={30} />
          </div>
          <h1 className="text-2xl font-bold text-text">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-textMuted">
            Iniciá sesión para ver tus reservas y guardar tus datos.
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-border bg-surface2 p-3 text-center text-sm font-medium text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-text">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-textMuted" size={20} />
                <input
                  type="email"
                  required
                  placeholder="tuemail@mail.com"
                  className="w-full rounded-xl border border-border bg-surface p-3 pl-10 text-text outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-textMuted" size={20} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-surface p-3 pl-10 text-text outline-none transition-all focus:border-ring focus:ring-2 focus:ring-ring"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Entrar <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full rounded-xl border border-border bg-surface py-3 text-sm font-bold text-text transition-colors hover:bg-surface2"
            >
              Continuar como invitado
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-textMuted">
            ¿Sos dueño?{' '}
            <Link href="/admin/login" className="font-semibold text-text hover:text-primary">
              Entrá al panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
