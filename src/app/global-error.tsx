'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for Next.js App Router
 * Catches errors in root layout and provides recovery UI
 *
 * NOTE: Must include own <html> and <body> tags since it replaces root layout
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log critical error to monitoring service
    console.error('Global error boundary caught:', error);

    // TODO: Send to error tracking service with high priority
    // Example: Sentry.captureException(error, { level: 'fatal' });
  }, [error]);

  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="flex max-w-md flex-col items-center text-center">
            {/* Icon */}
            <div className="mb-6 rounded-full bg-rose-50 p-5 ring-1 ring-rose-100">
              <AlertTriangle className="h-10 w-10 text-rose-600" />
            </div>

            {/* Content */}
            <div className="mb-8">
              <h1 className="mb-3 text-3xl font-bold text-slate-900">
                Error crítico
              </h1>
              <p className="text-base leading-relaxed text-slate-600">
                Ocurrió un error inesperado que impidió cargar la aplicación.
                Intentá recargar la página o volvé al inicio.
              </p>

              {/* Error details (dev mode) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 rounded-lg bg-slate-100 p-4 text-left">
                  <p className="text-xs font-mono text-slate-700 break-all">
                    {error.message}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <button
                onClick={reset}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <RotateCcw size={16} />
                Reintentar
              </button>

              <Link
                href="/"
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                <Home size={16} />
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
