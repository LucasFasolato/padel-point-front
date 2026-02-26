'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Lock, Mail, User } from 'lucide-react';
import { authService } from '@/services/auth-service';
import { toastManager } from '@/lib/toast';
import { useAuthStore } from '@/store/auth-store';
import { getPostAuthDestination } from '@/lib/auth-redirect';
import { AuthCard, GoogleIcon } from '@/app/components/auth/auth-card';

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

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!form.displayName.trim()) {
      next.displayName = 'El nombre es obligatorio';
    }
    if (!form.email.trim()) {
      next.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Ingresá un email válido';
    }
    if (!form.password) {
      next.password = 'La contraseña es obligatoria';
    } else if (form.password.length < 6) {
      next.password = 'Mínimo 6 caracteres';
    }
    if (form.password && form.confirmPassword !== form.password) {
      next.confirmPassword = 'Las contraseñas no coinciden';
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
      const dest = await getPostAuthDestination();
      if (controller.signal.aborted) return;
      router.replace(dest);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const resp = (
          err as { response?: { status?: number; data?: { message?: string } } }
        ).response;
        if (resp?.status === 409) {
          setErrors({ email: 'Este email ya está registrado' });
          return;
        }
        if (resp?.status === 400) {
          setErrors({ form: resp.data?.message ?? 'Revisá los datos e intentá de nuevo.' });
          return;
        }
      }

      const message =
        err instanceof Error && err.message
          ? err.message
          : 'No pudimos crear la cuenta. Intentá más tarde.';

      toastManager.error(message, { idempotencyKey: 'register-error' });
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

  const handleGoogleRegister = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      toastManager.error('Falta configurar NEXT_PUBLIC_API_URL para Google.', {
        idempotencyKey: 'register-google-missing-api-url',
      });
      return;
    }
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <AuthCard backHref="/">
      <h1 className="mb-1 text-center text-[22px] font-extrabold tracking-tight text-slate-900">
        Crear cuenta
      </h1>
      <p className="mb-7 text-center text-sm text-slate-500">
        Competí, subí de nivel y desafiá a tus amigos.
      </p>

      {/* Google — Primary CTA */}
      <button
        type="button"
        onClick={handleGoogleRegister}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:shadow-sm"
      >
        <GoogleIcon />
        Registrarse con Google
      </button>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-xs font-medium text-slate-400">o con email</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>

      {errors.form && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nombre
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="text"
              required
              placeholder="Tu nombre"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0E7C66] focus:bg-white focus:ring-2 focus:ring-[#0E7C66]/10"
              value={form.displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
              autoComplete="name"
            />
          </div>
          {errors.displayName && (
            <p className="mt-1 text-xs text-rose-600">{errors.displayName}</p>
          )}
        </div>

        {/* Email */}
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
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              autoComplete="email"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="password"
              required
              placeholder="Mínimo 6 caracteres"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0E7C66] focus:bg-white focus:ring-2 focus:ring-[#0E7C66]/10"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Confirmar contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="password"
              required
              placeholder="Repetí la contraseña"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0E7C66] focus:bg-white focus:ring-2 focus:ring-[#0E7C66]/10"
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
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0E7C66] text-sm font-semibold text-white transition-all hover:bg-[#0A6657] hover:shadow-md active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <>
              Crear cuenta <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        ¿Ya tenés cuenta?{' '}
        <Link
          href="/login"
          className="font-semibold text-[#0E7C66] transition-colors hover:text-[#0A6657]"
        >
          Iniciá sesión
        </Link>
      </p>
    </AuthCard>
  );
}
