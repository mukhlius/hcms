import React from 'react';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────
// Text-case helpers
// ──────────────────────────────────────────────
function toProperCase(value: string): string {
  return value.replace(/\w\S*/g, (word) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}

export type InputCase = 'proper' | 'upper' | 'none';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** 'proper' → Proper Case, 'upper' → UPPERCASE, 'none' → no transform (default) */
  inputCase?: InputCase;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, inputCase = 'none', onChange, value, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const sanitizedValue = value !== undefined ? (value === null ? '' : value) : undefined;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (inputCase !== 'none' && e.target.type !== 'email') {
        const raw = e.target.value;
        const transformed =
          inputCase === 'upper' ? raw.toUpperCase() : toProperCase(raw);
        // Mutate the native input value so the event carries the formatted text
        Object.defineProperty(e, 'target', {
          writable: false,
          value: Object.assign(e.target, { value: transformed }),
        });
      }
      onChange?.(e);
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            value={sanitizedValue}
            className={cn(
              'flex h-10 w-full rounded-lg border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-900 dark:disabled:text-slate-600 transition-colors',
              leftIcon ? 'pl-9' : '',
              rightIcon ? 'pr-9' : '',
              error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : '',
              className
            )}
            onChange={handleChange}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 animate-in fade-in duration-150">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
