'use client';

import { useEffect } from 'react';
import { ErrorState } from './components/ui/error-state';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Segment-level error boundary for Next.js App Router
 * Catches errors in page segments and provides recovery UI
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, LogRocket, etc.)
    console.error('Error boundary caught:', error);

    // TODO: Send to error tracking service
    // Example: Sentry.captureException(error);
  }, [error]);

  // Determine error message based on error type
  const getErrorMessage = () => {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return 'No pudimos conectarnos al servidor. Revisá tu conexión a internet.';
    }

    // Auth errors
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return 'Tu sesión expiró. Por favor, iniciá sesión nuevamente.';
    }

    // Generic fallback
    return 'Ocurrió un error inesperado. Por favor, intentá nuevamente.';
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ErrorState
        title="Algo salió mal"
        description={getErrorMessage()}
        showRetry={true}
        showHome={true}
        onRetry={reset}
      />
    </div>
  );
}
