'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { requestReset } from '@/services/password-reset-service';
import { toastManager } from '@/lib/toast';

const SUCCESS_MESSAGE = 'Si el email existe, te enviamos un link de recuperacion.';

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Recuperar contrasena</h1>
          <p className="mt-2 text-sm text-slate-500">
            Ingresa tu email y te enviaremos un link para restablecerla.
          </p>
        </div>

        {submitted && (
          <div className="mb-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
            {SUCCESS_MESSAGE}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tuemail@mail.com"
              className="w-full rounded-xl border border-slate-200 p-3 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enviar link de recuperacion
          </button>
        </form>

        <div className="mt-5 text-center text-sm">
          <Link href="/login" className="font-medium text-slate-600 hover:text-slate-900">
            Volver a iniciar sesion
          </Link>
        </div>
      </div>
    </div>
  );
}
