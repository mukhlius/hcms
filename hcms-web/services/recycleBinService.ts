import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types';

export type RecycleBinEntity =
  | 'users'
  | 'companies'
  | 'sites'
  | 'departments'
  | 'sections'
  | 'positions'
  | 'employment-types'
  | 'benefit-plafonds'
  | 'units';

export interface TrashSummary {
  users: number;
  companies: number;
  sites: number;
  departments?: number;
  sections?: number;
  positions: number;
  'employment-types'?: number;
  'benefit-plafonds'?: number;
  units?: number;
  [key: string]: number | undefined;
}

export interface TrashItem {
  id: number;
  name?: string;
  title?: string;
  code?: string;
  username?: string;
  email?: string;
  deleted_at: string;
  created_at?: string;
  updated_at?: string;
  roles?: Array<{ id: number; name: string; display_name?: string }>;
  company?: { id: number; name: string; code?: string };
  site?: { id: number; name: string; code?: string };
  department?: { id: number; name: string; code?: string };
  organization_unit?: { id: number; name: string; code?: string };
  job?: { id: number; name: string; code?: string };
  [key: string]: any;
}

export interface TrashListResponse {
  data: TrashItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const recycleBinService = {
  getSummary: async () => {
    const response = await apiClient.get<ApiResponse<TrashSummary>>('/admin/recycle-bin/summary');
    return response.data;
  },

  getItems: async (entity: RecycleBinEntity, params?: { search?: string; page?: number; per_page?: number }) => {
    const response = await apiClient.get<ApiResponse<TrashListResponse>>(`/admin/recycle-bin/${entity}`, { params });
    return response.data;
  },

  restoreItem: async (entity: RecycleBinEntity, id: number | string) => {
    const response = await apiClient.post<ApiResponse<any>>(`/admin/recycle-bin/${entity}/${id}/restore`);
    return response.data;
  },

  forceDeleteItem: async (entity: RecycleBinEntity, id: number | string) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/admin/recycle-bin/${entity}/${id}/force`);
    return response.data;
  },

  bulkRestore: async (entity: RecycleBinEntity, ids: (number | string)[]) => {
    const response = await apiClient.post<ApiResponse<{ restored_count: number }>>(`/admin/recycle-bin/${entity}/bulk-restore`, { ids });
    return response.data;
  },

  bulkForceDelete: async (entity: RecycleBinEntity, ids: (number | string)[]) => {
    const response = await apiClient.post<ApiResponse<{ deleted_count: number }>>(`/admin/recycle-bin/${entity}/bulk-force-delete`, { ids });
    return response.data;
  },
};
