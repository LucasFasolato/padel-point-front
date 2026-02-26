'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, Lock, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { confirmReset } from '@/services/password-reset-service';
import { toastManager } from '@/lib/toast';
import { AuthCard } from '@/app/components/auth/auth-card';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => (searchParams.get('token') ?? '').trim(), [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const tokenMissing = token.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || success) return;

    if (tokenMissing) {
      setError('El link es inválido o expiró');
      return;
    }
    if (!newPassword) {
      setError('Ingresá una nueva contraseña');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await confirmReset(token, newPassword);
      setSuccess(true);
      toastManager.success('Contraseña actualizada correctamente.', {
        idempotencyKey: 'password-reset-confirm-success',
      });
    } catch (err) {
      if (axios.isAxiosError(err) && [400, 401].includes(err.response?.status ?? 0)) {
        setError('El link es inválido o expiró');
      } else {
        setError('No pudimos restablecer la contraseña. Intentá nuevamente.');
      }
      toastManager.error('No pudimos restablecer la contraseña.', {
        idempotencyKey: 'password-reset-confirm-error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthCard backHref="/login">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#0E7C66]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900">
            Contraseña actualizada
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Ya podés iniciar sesión con tu nueva contraseña.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0E7C66] text-sm font-semibold text-white transition-all hover:bg-[#0A6657] hover:shadow-md"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard backHref="/login">
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0E7C66]/10 text-[#0E7C66]">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900">
          Nueva contraseña
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Ingresá tu nueva contraseña para recuperar el acceso.
        </p>
      </div>

      {(error || tokenMissing) && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error ?? 'El link es inválido o expiró'}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nueva contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0E7C66] focus:bg-white focus:ring-2 focus:ring-[#0E7C66]/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Confirmar contraseña
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetí la contraseña"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0E7C66] focus:bg-white focus:ring-2 focus:ring-[#0E7C66]/10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || tokenMissing}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0E7C66] text-sm font-semibold text-white transition-all hover:bg-[#0A6657] hover:shadow-md active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Restablecer contraseña
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        <Link
          href="/login"
          className="font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </AuthCard>
  );
}

function ResetPasswordPageFallback() {
  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0E7C66]/10 text-[#0E7C66]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Cargando...</h1>
        <p className="mt-1.5 text-sm text-slate-500">Preparando el formulario de recuperación.</p>
      </div>
    </AuthCard>
  );
}
