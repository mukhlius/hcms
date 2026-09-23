import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const API_BASE_URL = typeof window !== 'undefined'
  ? '/api/v1'
  : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 45000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    // Gunakan reverse proxy Next.js (/api/v1) di browser agar bebas kendala CORS dan firewall port backend
    config.baseURL = '/api/v1';

    const token = localStorage.getItem('hcms_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Correlation ID
    if (!config.headers['X-Request-ID']) {
      config.headers['X-Request-ID'] = generateRequestId();
    }
  }

  // Allow browser to set multipart boundary automatically for FormData
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; success?: boolean }>) => {
    // Tangani dan terjemahkan error jaringan / timeout ke Bahasa Indonesia
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      const friendlyMsg = 'Batas waktu koneksi habis (timeout). Server backend atau database sedang lambat atau tidak merespons.';
      error.message = friendlyMsg;
      if (!error.response) {
        (error as any).response = {
          status: 504,
          statusText: 'Gateway Timeout',
          data: { success: false, message: friendlyMsg },
          headers: {},
          config: error.config,
        };
      } else if (error.response.data) {
        error.response.data.message = friendlyMsg;
      }
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
      const friendlyMsg = 'Tidak dapat terhubung ke server backend (API). Pastikan server Laravel dan MySQL sedang berjalan.';
      error.message = friendlyMsg;
      if (!error.response) {
        (error as any).response = {
          status: 503,
          statusText: 'Service Unavailable',
          data: { success: false, message: friendlyMsg },
          headers: {},
          config: error.config,
        };
      }
    }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear credentials and route to login if unauthenticated on client
      if (!window.location.pathname.startsWith('/login')) {
        localStorage.removeItem('hcms_auth_token');
        localStorage.removeItem('hcms_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
