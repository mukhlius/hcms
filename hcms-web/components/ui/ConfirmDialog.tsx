'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react';
import { useAlertStore } from '@/stores/alertStore';
import { Button } from '@/components/ui/Button';

export const ConfirmDialog: React.FC = () => {
  const confirmState = useAlertStore((state) => state.confirmState);
  const closeConfirm = useAlertStore((state) => state.closeConfirm);

  const isOpen = Boolean(confirmState?.isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        closeConfirm(false);
      } else if (e.key === 'Enter') {
        closeConfirm(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeConfirm]);

  if (!confirmState) return null;

  const {
    title = 'Konfirmasi Tindakan',
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    variant = 'danger',
  } = confirmState;

  const variantConfig = {
    danger: {
      icon: <AlertCircle className="h-6 w-6 text-rose-600" />,
      iconBg: 'bg-rose-100/90 text-rose-600 ring-8 ring-rose-50',
      accentBorder: 'border-t-4 border-t-rose-500',
      confirmButtonVariant: 'danger' as const,
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
      iconBg: 'bg-amber-100/90 text-amber-600 ring-8 ring-amber-50',
      accentBorder: 'border-t-4 border-t-amber-500',
      confirmButtonVariant: 'secondary' as const,
    },
    primary: {
      icon: <HelpCircle className="h-6 w-6 text-blue-600" />,
      iconBg: 'bg-blue-100/90 text-blue-600 ring-8 ring-blue-50',
      accentBorder: 'border-t-4 border-t-blue-600',
      confirmButtonVariant: 'primary' as const,
    },
  };

  const currentVariant = variantConfig[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => closeConfirm(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Dialog Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-slate-200/90 z-10 ${currentVariant.accentBorder}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
          >
            {/* Close Corner Button */}
            <button
              type="button"
              onClick={() => closeConfirm(false)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Tutup dialog"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              {/* Variant Icon */}
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs ${currentVariant.iconBg}`}
              >
                {currentVariant.icon}
              </div>

              {/* Title & Description */}
              <div className="flex-1 space-y-1.5 pt-0.5">
                <h3
                  id="confirm-dialog-title"
                  className="text-base font-bold text-slate-900 leading-snug tracking-tight"
                >
                  {title}
                </h3>
                <p
                  id="confirm-dialog-message"
                  className="text-xs text-slate-600 leading-relaxed"
                >
                  {message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs px-3.5 h-8 font-medium"
                onClick={() => closeConfirm(false)}
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                variant={currentVariant.confirmButtonVariant}
                size="sm"
                className="text-xs px-4 h-8 font-semibold shadow-xs"
                onClick={() => closeConfirm(true)}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
