'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { requestReset } from '@/services/password-reset-service';
import { toastManager } from '@/lib/toast';
import { AuthCard } from '@/app/components/auth/auth-card';

const SUCCESS_MESSAGE = 'Si el email existe, te enviamos un link de recuperación.';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      await requestReset(email.trim());
    } catch {
      // Intentionally return the same response to avoid exposing account existence.
    } finally {
      setSubmitted(true);
      toastManager.success(SUCCESS_MESSAGE, {
        idempotencyKey: 'password-reset-request-success',
      });
      setLoading(false);
    }
  };

  return (
    <AuthCard backHref="/login">
      <div className="mb-7 flex flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0E7C66]/10 text-[#0E7C66]">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-slate-900">
          Recuperar contraseña
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Ingresá tu email y te enviamos un link para restablecerla.
        </p>
      </div>

      {submitted && (
        <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {SUCCESS_MESSAGE}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuemail@mail.com"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#0E7C66] focus:bg-white focus:ring-2 focus:ring-[#0E7C66]/10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || submitted}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0E7C66] text-sm font-semibold text-white transition-all hover:bg-[#0A6657] hover:shadow-md active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar link de recuperación
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
