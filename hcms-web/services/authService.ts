import { apiClient } from '@/lib/api';
import { ApiResponse, User } from '@/types';

export const authService = {
  login: async (credentials: { username: string; password: string; remember_me?: boolean }) => {
    const response = await apiClient.post<ApiResponse<{ token: string; session_id: string; user: User }>>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  me: async () => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },

  changePassword: async (data: { current_password: string; new_password: string; new_password_confirmation: string }) => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/change-password', data);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data: { email: string; token: string; password: string; password_confirmation: string }) => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/reset-password', data);
    return response.data;
  },
};
