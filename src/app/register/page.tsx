'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Lock, Mail, User } from 'lucide-react';
import { authService } from '@/services/auth-service';
import { toastManager } from '@/lib/toast';
import { useAuthStore } from '@/store/auth-store';

interface RegisterForm {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState<RegisterForm>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!form.displayName.trim()) {
      next.displayName = 'El nombre es obligatorio';
    }

    if (!form.email.trim()) {
      next.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Ingresa un email valido';
    }

    if (!form.password) {
      next.password = 'La contrasena es obligatoria';
    } else if (form.password.length < 6) {
      next.password = 'Minimo 6 caracteres';
    }

    if (form.password && form.confirmPassword !== form.password) {
      next.confirmPassword = 'Las contrasenas no coinciden';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !validate()) return;

    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await authService.register(
        form.displayName.trim(),
        form.email.trim(),
        form.password
      );

      if (controller.signal.aborted) return;

      setUser(res.user);
      router.replace('/');
    } catch (err: unknown) {
      if (controller.signal.aborted) return;

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const resp = (err as { response?: { status?: number; data?: { message?: string } } }).response;

        if (resp?.status === 409) {
          setErrors({ email: 'Este email ya esta registrado' });
          return;
        }
        if (resp?.status === 400) {
          setErrors({ form: resp.data?.message || 'Revisa los datos e intenta de nuevo.' });
          return;
        }
      }

      const message =
        err instanceof Error && err.message
          ? err.message
          : 'No pudimos crear la cuenta. Intenta mas tarde.';

      toastManager.error(message, {
        idempotencyKey: 'register-error',
      });
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const updateField = (field: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
        <div className="bg-slate-900 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <User size={30} />
          </div>
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="mt-2 text-sm text-slate-300">
            Registrate para reservar canchas y competir con amigos.
          </p>
        </div>

        <div className="p-8">
          {errors.form && (
            <div className="mb-4 rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="text"
                  required
                  placeholder="Tu nombre"
                  className="w-full rounded-xl border border-slate-200 p-3 pl-10 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={form.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  autoComplete="name"
                />
              </div>
              {errors.displayName && (
                <p className="mt-1 text-xs text-rose-600">{errors.displayName}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="email"
                  required
                  placeholder="tuemail@mail.com"
                  className="w-full rounded-xl border border-slate-200 p-3 pl-10 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Contrasena</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  required
                  placeholder="Minimo 6 caracteres"
                  className="w-full rounded-xl border border-slate-200 p-3 pl-10 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Confirmar contrasena
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
                <input
                  type="password"
                  required
                  placeholder="Repeti la contrasena"
                  className="w-full rounded-xl border border-slate-200 p-3 pl-10 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-bold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Crear cuenta <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Ya tenes cuenta?{' '}
            <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Inicia sesion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
