'use client';

import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  /** Error title/headline */
  title?: string;
  /** Error description/message */
  description?: string;
  /** Show retry button */
  showRetry?: boolean;
  /** Show home button */
  showHome?: boolean;
  /** Retry action callback */
  onRetry?: () => void;
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: 'default' | 'compact';
}

export function ErrorState({
  title = 'Algo salió mal',
  description = 'Ocurrió un error inesperado. Por favor, intentá nuevamente.',
  showRetry = true,
  showHome = true,
  onRetry,
  className,
  size = 'default',
}: ErrorStateProps) {
  const router = useRouter();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Default: reload page
      window.location.reload();
    }
  };

  const handleHome = () => {
    router.push('/');
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'default' ? 'px-6 py-16' : 'px-4 py-8',
        className
      )}
    >
      {/* Icon */}
      <div className="mb-6 rounded-full bg-rose-50 p-4 ring-1 ring-rose-100">
        <AlertTriangle className="h-8 w-8 text-rose-600" />
      </div>

      {/* Content */}
      <div className="mb-8 max-w-md">
        <h2
          className={cn(
            'font-semibold text-slate-900',
            size === 'default' ? 'text-2xl mb-3' : 'text-xl mb-2'
          )}
        >
          {title}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </div>

      {/* Actions */}
      {(showRetry || showHome) && (
        <div className="flex flex-col gap-3 w-full max-w-xs sm:flex-row sm:max-w-md">
          {showRetry && (
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 min-h-[44px]"
            >
              <RotateCcw size={16} />
              Reintentar
            </button>
          )}

          {showHome && (
            <button
              onClick={handleHome}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 min-h-[44px]"
            >
              <Home size={16} />
              Volver al inicio
            </button>
          )}
        </div>
      )}
    </div>
  );
}
