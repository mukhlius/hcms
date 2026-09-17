import { apiClient, API_BASE_URL } from '@/lib/api';
import { ApiResponse } from '@/types';
import { CompanyDocumentItem, DocumentCategoryCount } from '@/types/companyDocument';

export const companyDocumentService = {
  // Admin Methods
  getAdminDocuments: async (params?: {
    search?: string;
    category?: string;
    audience_type?: string;
    status?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
  }) => {
    const res = await apiClient.get<
      ApiResponse<{ data: CompanyDocumentItem[]; total: number; current_page: number; last_page: number }> & {
        counts?: DocumentCategoryCount;
      }
    >('/admin/master-data/company-documents', { params });
    return res.data;
  },

  getAdminDocument: async (id: number) => {
    const res = await apiClient.get<ApiResponse<CompanyDocumentItem>>(`/admin/master-data/company-documents/${id}`);
    return res.data;
  },

  createAdminDocument: async (formData: FormData) => {
    const res = await apiClient.post<ApiResponse<CompanyDocumentItem>>(
      '/admin/master-data/company-documents',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data;
  },

  updateAdminDocument: async (id: number, formData: FormData) => {
    // In Laravel, file upload on update uses POST with _method=PUT
    formData.append('_method', 'PUT');
    const res = await apiClient.post<ApiResponse<CompanyDocumentItem>>(
      `/admin/master-data/company-documents/${id}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return res.data;
  },

  deleteAdminDocument: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/company-documents/${id}`);
    return res.data;
  },

  toggleAdminDocumentStatus: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<CompanyDocumentItem>>(`/admin/master-data/company-documents/${id}/toggle-status`);
    return res.data;
  },

  // ESS Methods
  getEssDocuments: async (params?: {
    search?: string;
    category?: string;
    page?: number;
    per_page?: number;
  }) => {
    const res = await apiClient.get<
      ApiResponse<{
        documents: { data: CompanyDocumentItem[]; total: number; current_page: number; last_page: number };
        counts: DocumentCategoryCount;
      }>
    >('/ess/documents', { params });
    return res.data;
  },

  getEssDocument: async (id: number) => {
    const res = await apiClient.get<ApiResponse<CompanyDocumentItem>>(`/ess/documents/${id}`);
    return res.data;
  },

  markAsRead: async (id: number) => {
    const res = await apiClient.post<ApiResponse<any>>(`/ess/documents/${id}/read`);
    return res.data;
  },

  // Secure File Download via Blob (Handles Auth Header)
  downloadDocument: async (id: number, fileName: string, isEss: boolean = false) => {
    const endpoint = isEss
      ? `/ess/documents/${id}/download`
      : `/admin/master-data/company-documents/${id}/download`;

    const response = await apiClient.get(endpoint, {
      responseType: 'blob',
    });

    const contentType = (response.headers['content-type'] as string) || 'application/octet-stream';
    const blob = new Blob([response.data], { type: contentType });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Secure PDF Blob Stream for In-App Viewer
  getPreviewBlobUrl: async (id: number, isEss: boolean = false): Promise<string> => {
    const endpoint = isEss
      ? `/ess/documents/${id}/preview`
      : `/admin/master-data/company-documents/${id}/preview`;

    const response = await apiClient.get(endpoint, {
      responseType: 'blob',
    });

    const contentType = (response.headers['content-type'] as string) || 'application/pdf';
    const blob = new Blob([response.data], { type: contentType });
    return window.URL.createObjectURL(blob);
  },
};
