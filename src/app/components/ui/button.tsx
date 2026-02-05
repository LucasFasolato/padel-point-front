import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state (shows spinner, disables button) */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
}

/**
 * Base Button component with consistent styling and accessibility
 *
 * Features:
 * - 5 variants: primary (emerald), secondary (slate), outline, ghost, danger
 * - 3 sizes with proper tap targets (sm: 40px, md: 44px, lg: 48px)
 * - Loading state with spinner
 * - Focus-visible rings for keyboard navigation
 * - Hover/active micro-animations
 *
 * @example
 * <Button variant="primary" size="md" loading={isSubmitting}>
 *   Reservar
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

    const variantStyles = {
      primary:
        'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-emerald-500',
      secondary:
        'bg-slate-800 text-white shadow-sm hover:bg-slate-900 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-slate-500',
      outline:
        'border-2 border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 active:scale-[0.98] focus-visible:ring-slate-500',
      ghost:
        'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98] focus-visible:ring-slate-500',
      danger:
        'bg-rose-600 text-white shadow-sm hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-rose-500',
    };

    const sizeStyles = {
      sm: 'px-4 py-2 text-sm min-h-[40px]', // 40px tap target
      md: 'px-6 py-3 text-sm min-h-[44px]', // 44px tap target (recommended)
      lg: 'px-8 py-4 text-base min-h-[48px]', // 48px tap target
    };

    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          widthStyles,
          className
        )}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
