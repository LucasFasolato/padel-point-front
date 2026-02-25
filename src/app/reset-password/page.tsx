'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, Lock, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { confirmReset } from '@/services/password-reset-service';
import { toastManager } from '@/lib/toast';

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
      setError('El link es invalido o expiro');
      return;
    }

    if (!newPassword) {
      setError('Ingresa una nueva contrasena');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await confirmReset(token, newPassword);
      setSuccess(true);
      toastManager.success('Contrasena actualizada correctamente.', {
        idempotencyKey: 'password-reset-confirm-success',
      });
    } catch (err) {
      if (axios.isAxiosError(err) && [400, 401].includes(err.response?.status ?? 0)) {
        setError('El link es invalido o expiro');
      } else {
        setError('No pudimos restablecer la contrasena. Intenta nuevamente.');
      }

      toastManager.error('No pudimos restablecer la contrasena.', {
        idempotencyKey: 'password-reset-confirm-error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Contrasena actualizada</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ya puedes iniciar sesion con tu nueva contrasena.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Ir a login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva contrasena</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa tu nueva contrasena para recuperar el acceso.
          </p>
        </div>

        {(error || tokenMissing) && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error ?? 'El link es invalido o expiro'}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Nueva contrasena
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
              className="w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Confirmar contrasena
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contrasena"
              className="w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading || tokenMissing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Restablecer contrasena
          </button>
        </form>

        <div className="mt-5 text-center text-sm">
          <Link href="/login" className="font-medium text-slate-600 hover:text-slate-900">
            Volver a login
          </Link>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Cargando...</h1>
        <p className="mt-2 text-sm text-slate-500">Preparando el formulario de recuperacion.</p>
      </div>
    </div>
  );
}
