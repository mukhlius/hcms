import { create } from 'zustand';
import { User } from '@/types';

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (token: string, user: User) => {
    localStorage.setItem('hcms_auth_token', token);
    localStorage.setItem('hcms_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  clearAuth: () => {
    localStorage.removeItem('hcms_auth_token');
    localStorage.removeItem('hcms_user');
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  hasPermission: (permission: string) => {
    const { user } = get();
    if (!user) return false;
    // Super admin override
    if (user.roles?.some(r => (typeof r === 'string' ? r : r?.name) === 'SUPER_ADMIN') || user.data_scope === 'GLOBAL') {
      return true;
    }
    return Boolean(user.permissions?.includes(permission));
  },

  hasRole: (roleName: string) => {
    const { user } = get();
    if (!user) return false;
    return Boolean(user.roles?.some(r => (typeof r === 'string' ? r : r?.name) === roleName));
  },

  initFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('hcms_auth_token');
      const userStr = localStorage.getItem('hcms_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true, isLoading: false });
      } else {
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ token: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
