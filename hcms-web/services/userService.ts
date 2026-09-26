import { apiClient } from '@/lib/api';
import { ApiResponse, User } from '@/types';

export interface UserFilterParams {
  search?: string;
  status?: string;
  role?: string;
  site_id?: number | string;
  department_id?: number | string;
  /** '1' = hanya yg terhubung karyawan, '0' = hanya yg tidak terhubung, '' = semua */
  linked_to_employee?: '1' | '0' | '';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export const userService = {
  getUsers: async (params?: UserFilterParams) => {
    const response = await apiClient.get<ApiResponse<User[]>>('/admin/users', { params });
    return response.data;
  },

  getUser: async (id: number) => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/users/${id}`);
    return response.data;
  },

  createUser: async (payload: any) => {
    const response = await apiClient.post<ApiResponse<User>>('/admin/users', payload);
    return response.data;
  },

  updateUser: async (id: number, payload: any) => {
    const response = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}`, payload);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/admin/users/${id}`);
    return response.data;
  },

  unlockUser: async (id: number) => {
    const response = await apiClient.post<ApiResponse<null>>(`/admin/users/${id}/unlock`);
    return response.data;
  },

  resetPassword: async (id: number, password: string) => {
    const response = await apiClient.post<ApiResponse<null>>(`/admin/users/${id}/reset-password`, { password });
    return response.data;
  },

  revokeSessions: async (id: number) => {
    const response = await apiClient.post<ApiResponse<null>>(`/admin/users/${id}/revoke-sessions`);
    return response.data;
  },
};
