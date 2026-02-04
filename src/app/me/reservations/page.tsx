'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';

export default function MyReservationsPage() {
  const { token } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Mis reservas</h1>
          {!token ? (
            <>
              <p className="mt-3 text-slate-500">
                Iniciá sesión para ver tus reservas.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-colors"
              >
                Iniciar sesión
              </Link>
            </>
          ) : (
            <p className="mt-3 text-slate-500">Próximamente.</p>
          )}
        </div>
      </div>
    </div>
  );
}
