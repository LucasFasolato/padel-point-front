import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Hint text below input */
  hint?: string;
  /** Error message (shows red state) */
  error?: string;
  /** Required field indicator */
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      hint,
      error,
      required,
      disabled,
      id,
      type = 'text',
      ...props
    },
    ref
  ) => {
    // eslint-disable-next-line react-hooks/purity
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const inputBaseStyles =
      'w-full rounded-xl border px-4 py-3 text-sm transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 min-h-[44px]';

    const inputStateStyles = error
      ? 'border-rose-500 bg-rose-50/50 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
      : 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-emerald-500/20';

    const inputDisabledStyles = disabled
      ? 'cursor-not-allowed bg-slate-50 text-slate-400'
      : '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            {label}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          className={cn(
            inputBaseStyles,
            inputStateStyles,
            inputDisabledStyles,
            className
          )}
          {...props}
        />

        {(hint || error) && (
          <p
            className={cn(
              'mt-1.5 text-xs',
              error ? 'text-rose-600' : 'text-slate-500'
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';