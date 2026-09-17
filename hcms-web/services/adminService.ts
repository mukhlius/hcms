import { apiClient } from '@/lib/api';
import { 
  ApiResponse, 
  AuditLog, 
  OrganizationMetadata, 
  Permission, 
  Role, 
  SecurityEvent, 
  SystemSetting, 
  UserSession 
} from '@/types';

export const roleService = {
  getRoles: async () => {
    const res = await apiClient.get<ApiResponse<Role[]>>('/admin/roles');
    return res.data;
  },
  getRole: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Role>>(`/admin/roles/${id}`);
    return res.data;
  },
  createRole: async (payload: any) => {
    const res = await apiClient.post<ApiResponse<Role>>('/admin/roles', payload);
    return res.data;
  },
  updateRole: async (id: number, payload: any) => {
    const res = await apiClient.put<ApiResponse<Role>>(`/admin/roles/${id}`, payload);
    return res.data;
  },
  deleteRole: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/roles/${id}`);
    return res.data;
  },
};

export const permissionService = {
  getPermissions: async () => {
    const res = await apiClient.get<ApiResponse<Record<string, Permission[]>>>('/admin/permissions');
    return res.data;
  },
};

export const sessionService = {
  getSessions: async (params?: { user_id?: number; active_only?: boolean; page?: number; per_page?: number; sort_by?: string; sort_order?: 'asc' | 'desc' }) => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/sessions', { params });
    return res.data;
  },
  revokeSession: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/sessions/${id}`);
    return res.data;
  },
  revokeOtherSessions: async () => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/sessions/revoke-others');
    return res.data;
  },
};

export const securityService = {
  getEvents: async (params?: { event_type?: string; severity?: string; user_id?: number; page?: number; per_page?: number; sort_by?: string; sort_order?: 'asc' | 'desc' }) => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/security-events', { params });
    return res.data;
  },
  getStats: async () => {
    const res = await apiClient.get<ApiResponse<Record<string, number>>>('/admin/security-events/stats');
    return res.data;
  },
};

export const auditService = {
  getLogs: async (params?: { action?: string; module?: string; actor_id?: number; search?: string; page?: number; per_page?: number; sort_by?: string; sort_order?: 'asc' | 'desc' }) => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/audit-logs', { params });
    return res.data;
  },
  getLog: async (id: number) => {
    const res = await apiClient.get<ApiResponse<AuditLog>>(`/admin/audit-logs/${id}`);
    return res.data;
  },
};

export const settingService = {
  getSettings: async (category?: string) => {
    const res = await apiClient.get<ApiResponse<SystemSetting[]>>('/admin/settings', { params: { category } });
    return res.data;
  },
  updateBatch: async (settings: Array<{ key: string; value: any }>) => {
    const res = await apiClient.post<ApiResponse<SystemSetting[]>>('/admin/settings/batch', { settings });
    return res.data;
  },
  getPublicSettings: async () => {
    const res = await apiClient.get<ApiResponse<Record<string, any>>>('/public/settings');
    return res.data;
  },
  uploadAppIcon: async (file: File) => {
    const formData = new FormData();
    formData.append('icon', file);
    const res = await apiClient.post<ApiResponse<{ url: string; setting: SystemSetting }>>(
      '/admin/settings/upload-icon',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },
  removeAppIcon: async () => {
    const res = await apiClient.delete<ApiResponse<null>>('/admin/settings/remove-icon');
    return res.data;
  },
};

export const notificationService = {
  getNotifications: async () => {
    const res = await apiClient.get<ApiResponse<any>>('/notifications');
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await apiClient.get<ApiResponse<{ unread_count: number }>>('/notifications/unread-count');
    return res.data;
  },
  markAsRead: async (id: string) => {
    const res = await apiClient.post<ApiResponse<null>>(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.post<ApiResponse<null>>('/notifications/read-all');
    return res.data;
  },
};

export const organizationService = {
  getMetadata: async () => {
    const res = await apiClient.get<ApiResponse<OrganizationMetadata>>('/organizations');
    return res.data;
  },
};
