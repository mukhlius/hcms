import { apiClient } from '@/lib/api';
import { ApiResponse } from '@/types';
import {
  EmployeeReregistration,
  ReregistrationStats,
  ProposedData,
  DifferenceSummary,
} from '@/types/reregistration';
import { Employee } from '@/types/employee';

export interface EssCurrentData {
  employee: Employee;
  pending_ticket: EmployeeReregistration | null;
  latest_ticket: EmployeeReregistration | null;
  stats: ReregistrationStats;
}

export interface AdminDetailData {
  ticket: EmployeeReregistration;
  differences: DifferenceSummary;
}

export const reRegistrationService = {
  // ── ESS ENDPOINTS ──────────────────────────────────────────────────────────
  /**
   * Ambil data profil terkini karyawan & status tiket aktif
   */
  getEssCurrent: async () => {
    const response = await apiClient.get<ApiResponse<EssCurrentData>>('/ess/re-registration/current');
    return response.data;
  },

  /**
   * Ambil riwayat pengajuan registrasi ulang mandiri karyawan
   */
  getEssHistory: async (page = 1, perPage = 10) => {
    const response = await apiClient.get<ApiResponse<any>>('/ess/re-registration/history', {
      params: { page, per_page: perPage },
    });
    return response.data;
  },

  /**
   * Ajukan registrasi ulang / pembaruan data mandiri
   */
  submitEssReRegistration: async (payload: {
    submission_notes?: string;
    proposed_data: ProposedData;
  }) => {
    const response = await apiClient.post<ApiResponse<EmployeeReregistration>>(
      '/ess/re-registration',
      payload
    );
    return response.data;
  },

  /**
   * Batalkan pengajuan registrasi ulang yang masih berstatus PENDING
   */
  cancelEssReRegistration: async (id: number) => {
    const response = await apiClient.delete<ApiResponse<null>>(`/ess/re-registration/${id}/cancel`);
    return response.data;
  },

  // ── ADMIN / HC APPROVAL ENDPOINTS ──────────────────────────────────────────
  /**
   * Ambil ringkasan statistik pengajuan
   */
  getAdminStats: async () => {
    const response = await apiClient.get<ApiResponse<ReregistrationStats>>(
      '/admin/employee-reregistrations/stats'
    );
    return response.data;
  },

  /**
   * Ambil daftar pengajuan untuk verifikasi oleh HC
   */
  getAdminList: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) => {
    const response = await apiClient.get<ApiResponse<any>>(
      '/admin/employee-reregistrations',
      { params }
    );
    return response.data;
  },

  /**
   * Ambil detail tiket beserta kalkulasi perbedaan field (diff)
   */
  getAdminDetail: async (id: number) => {
    const response = await apiClient.get<ApiResponse<AdminDetailData>>(
      `/admin/employee-reregistrations/${id}`
    );
    return response.data;
  },

  /**
   * Setujui pengajuan registrasi ulang dan terapkan langsung ke master data
   */
  approveReRegistration: async (id: number, reviewNotes?: string) => {
    const response = await apiClient.post<ApiResponse<EmployeeReregistration>>(
      `/admin/employee-reregistrations/${id}/approve`,
      { review_notes: reviewNotes }
    );
    return response.data;
  },

  /**
   * Tolak pengajuan registrasi ulang dengan alasan wajib
   */
  rejectReRegistration: async (id: number, reviewNotes: string) => {
    const response = await apiClient.post<ApiResponse<EmployeeReregistration>>(
      `/admin/employee-reregistrations/${id}/reject`,
      { review_notes: reviewNotes }
    );
    return response.data;
  },
};
