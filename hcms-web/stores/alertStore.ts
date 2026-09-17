import { create } from 'zustand';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: AlertType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve?: (value: boolean) => void;
}

interface AlertStore {
  toasts: ToastItem[];
  confirmState: ConfirmState | null;

  // Toast actions
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Confirm actions
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  closeConfirm: (result: boolean) => void;
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  toasts: [],
  confirmState: null,

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = {
      id,
      duration: 4000,
      ...toast,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  openConfirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        confirmState: {
          ...options,
          isOpen: true,
          resolve,
        },
      });
    });
  },

  closeConfirm: (result) => {
    const { confirmState } = get();
    if (confirmState?.resolve) {
      confirmState.resolve(result);
    }
    set({ confirmState: null });
  },
}));

// Ergonomic helper functions for global usage
export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    return useAlertStore.getState().addToast({
      type: 'success',
      title: title || 'Berhasil',
      message,
      duration,
    });
  },
  error: (message: string, title?: string, duration?: number) => {
    return useAlertStore.getState().addToast({
      type: 'error',
      title: title || 'Gagal',
      message,
      duration: duration || 5000,
    });
  },
  warning: (message: string, title?: string, duration?: number) => {
    return useAlertStore.getState().addToast({
      type: 'warning',
      title: title || 'Peringatan',
      message,
      duration,
    });
  },
  info: (message: string, title?: string, duration?: number) => {
    return useAlertStore.getState().addToast({
      type: 'info',
      title: title || 'Informasi',
      message,
      duration,
    });
  },
};

export const confirmDialog = (options: ConfirmOptions): Promise<boolean> => {
  return useAlertStore.getState().openConfirm(options);
};
