'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X 
} from 'lucide-react';
import { useAlertStore, ToastItem } from '@/stores/alertStore';
import { cn } from '@/lib/utils';

export const ToastContainer: React.FC = () => {
  const toasts = useAlertStore((state) => state.toasts);
  const removeToast = useAlertStore((state) => state.removeToast);

  const getToastConfig = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
          containerBg: 'bg-white/95 border-emerald-300 shadow-lg shadow-emerald-500/10',
          titleColor: 'text-emerald-900',
          barColor: 'bg-emerald-500',
          badgeBg: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
          containerBg: 'bg-white/95 border-rose-300 shadow-lg shadow-rose-500/10',
          titleColor: 'text-rose-900',
          barColor: 'bg-rose-500',
          badgeBg: 'bg-rose-50 border-rose-100 text-rose-700',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
          containerBg: 'bg-white/95 border-amber-300 shadow-lg shadow-amber-500/10',
          titleColor: 'text-amber-900',
          barColor: 'bg-amber-500',
          badgeBg: 'bg-amber-50 border-amber-100 text-amber-700',
        };
      case 'info':
      default:
        return {
          icon: <Info className="h-5 w-5 text-blue-600 shrink-0" />,
          containerBg: 'bg-white/95 border-blue-300 shadow-lg shadow-blue-500/10',
          titleColor: 'text-blue-900',
          barColor: 'bg-blue-500',
          badgeBg: 'bg-blue-50 border-blue-100 text-blue-700',
        };
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-2 sm:px-0"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const cfg = getToastConfig(toast.type);
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, x: 20, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              className={cn(
                'pointer-events-auto relative overflow-hidden rounded-xl border p-4 backdrop-blur-md transition-all',
                cfg.containerBg
              )}
            >
              {/* Left Accent Color Indicator Bar */}
              <div className={cn('absolute left-0 top-0 bottom-0 w-1.5', cfg.barColor)} />

              <div className="flex items-start gap-3 pl-1.5">
                <div className="mt-0.5">{cfg.icon}</div>

                <div className="flex-1 space-y-1">
                  {toast.title && (
                    <h5 className={cn('text-xs font-bold tracking-tight', cfg.titleColor)}>
                      {toast.title}
                    </h5>
                  )}
                  <p className="text-xs text-slate-600 leading-snug">
                    {toast.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Tutup notifikasi"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
