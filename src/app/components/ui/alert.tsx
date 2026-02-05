import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps {
  /** Alert variant */
  variant?: 'info' | 'success' | 'warning' | 'error';
  /** Alert title (optional) */
  title?: string;
  /** Alert description/children */
  children: ReactNode;
  /** Custom className */
  className?: string;
}

/**
 * Alert component for displaying contextual messages
 *
 * Features:
 * - 4 semantic variants (info, success, warning, error)
 * - Auto-selected icons based on variant
 * - Optional title
 * - Accessible color contrast
 *
 * @example
 * <Alert variant="success" title="Reserva confirmada">
 *   Tu turno está asegurado por 15 minutos.
 * </Alert>
 */
export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: AlertProps) {
  const config = {
    info: {
      icon: Info,
      containerStyles: 'bg-blue-50 border-blue-200 text-blue-900',
      iconStyles: 'text-blue-600',
    },
    success: {
      icon: CheckCircle2,
      containerStyles: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      iconStyles: 'text-emerald-600',
    },
    warning: {
      icon: AlertTriangle,
      containerStyles: 'bg-amber-50 border-amber-200 text-amber-900',
      iconStyles: 'text-amber-600',
    },
    error: {
      icon: AlertTriangle,
      containerStyles: 'bg-rose-50 border-rose-200 text-rose-900',
      iconStyles: 'text-rose-600',
    },
  };

  const { icon: Icon, containerStyles, iconStyles } = config[variant];

  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border p-4',
        containerStyles,
        className
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0', iconStyles)} />
      <div className="flex-1">
        {title && <p className="mb-1 font-semibold text-sm">{title}</p>}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
