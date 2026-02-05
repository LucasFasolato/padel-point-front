'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { LayoutDashboard, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', form);

      const token = res.data.accessToken || res.data.access_token || res.data.token;
      if (!token) {
        throw new Error('El servidor no devolvió un token válido.');
      }

      const user = res.data.user || { userId: 'temp-id', email: form.email, role: 'ADMIN' };
      setAuth(token, user);

      router.replace('/admin/dashboard');
    } catch (err: unknown) {
      console.error(err);
      setError('Credenciales inválidas o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-2xl">
        <div className="border-b border-border bg-surface2 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <LayoutDashboard size={32} />
          </div>
          <h1 className="text-2xl font-bold text-text">PadelPoint Admin</h1>
          <p className="mt-2 text-sm text-textMuted">
            Gestioná tu club, reservas y pagos desde un solo lugar.
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-danger/20 bg-danger/10 p-3 text-center text-sm font-medium text-danger">
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
                  placeholder="admin@club.com"
                  className="w-full rounded-xl border border-border p-3 pl-10 outline-none transition-all focus:ring-2 focus:ring-ring"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                  className="w-full rounded-xl border border-border p-3 pl-10 outline-none transition-all focus:ring-2 focus:ring-ring"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                  Ingresar <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-bold text-textMuted transition-colors hover:bg-surface2"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
