'use client';

import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'success' | 'danger' | 'error' | 'warning' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  children,
  onClose,
  className,
  action,
}) => {
  const normalizedVariant = variant === 'error' ? 'danger' : variant;

  const styles = {
    success: {
      container: 'bg-emerald-50/90 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-900',
      closeBtn: 'text-emerald-600 hover:bg-emerald-100/60',
    },
    danger: {
      container: 'bg-rose-50/90 border-rose-200 text-rose-900',
      icon: <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />,
      titleColor: 'text-rose-900',
      closeBtn: 'text-rose-600 hover:bg-rose-100/60',
    },
    warning: {
      container: 'bg-amber-50/90 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-900',
      closeBtn: 'text-amber-600 hover:bg-amber-100/60',
    },
    info: {
      container: 'bg-blue-50/90 border-blue-200 text-blue-900',
      icon: <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
      titleColor: 'text-blue-900',
      closeBtn: 'text-blue-600 hover:bg-blue-100/60',
    },
  };

  const current = styles[normalizedVariant];

  return (
    <div
      role="alert"
      className={cn(
        'relative flex items-start gap-3 rounded-lg border p-3.5 text-xs transition-all shadow-2xs',
        current.container,
        className
      )}
    >
      {current.icon}
      <div className="flex-1 space-y-0.5">
        {title && <h5 className={cn('font-semibold text-xs', current.titleColor)}>{title}</h5>}
        {message && <p className="leading-relaxed opacity-90">{message}</p>}
        {children}
        {action && <div className="pt-2">{action}</div>}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={cn('rounded p-1 transition-colors cursor-pointer', current.closeBtn)}
          aria-label="Tutup alert"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
