import { apiClient } from '@/lib/api';
import { ApiResponse, Employee, EmployeeCareerHistory, EmployeeFilterParams } from '@/types';

export const employeeService = {
  /**
   * Ambil daftar karyawan berpaginasi dengan filter
   */
  getEmployees: async (params?: EmployeeFilterParams) => {
    const response = await apiClient.get<ApiResponse<Employee[]>>('/admin/employees', { params });
    return response.data;
  },

  /**
   * Ambil detail lengkap profil karyawan
   */
  getEmployee: async (id: number) => {
    const response = await apiClient.get<ApiResponse<Employee>>(`/admin/employees/${id}`);
    return response.data;
  },

  /**
   * Registrasi karyawan baru beserta akun login dan snapshot karir
   */
  createEmployee: async (payload: any) => {
    const response = await apiClient.post<ApiResponse<Employee>>('/admin/employees', payload);
    return response.data;
  },

  /**
   * Perbarui data profil karyawan
   */
  updateEmployee: async (id: number, payload: any) => {
    const response = await apiClient.put<ApiResponse<Employee>>(`/admin/employees/${id}`, payload);
    return response.data;
  },

  /**
   * Hapus / nonaktifkan karyawan (soft delete)
   */
  deleteEmployee: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/admin/employees/${id}`);
    return response.data;
  },

  /**
   * Rekam mutasi / promosi / rotasi karir dengan snapshot baku
   */
  recordMovement: async (id: number, payload: any) => {
    const response = await apiClient.post<ApiResponse<EmployeeCareerHistory>>(`/admin/employees/${id}/movements`, payload);
    return response.data;
  },

  /**
   * Toggle status aktif / nonaktif (dan auto-logout akun login)
   */
  toggleStatus: async (id: number, status: string, reason?: string) => {
    const response = await apiClient.post<ApiResponse<Employee>>(`/admin/employees/${id}/toggle-status`, {
      status,
      reason,
    });
    return response.data;
  },

  /**
   * Reset password karyawan oleh Admin HR
   */
  resetPassword: async (id: number, password?: string) => {
    const response = await apiClient.post<ApiResponse<{ username: string; temporary_password: string; force_password_change: boolean }>>(
      `/admin/employees/${id}/reset-password`,
      { password }
    );
    return response.data;
  },
};
