import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

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
    const token = localStorage.getItem('hcms_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Correlation ID
    if (!config.headers['X-Request-ID']) {
      config.headers['X-Request-ID'] = crypto.randomUUID();
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
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
