import { apiClient } from '@/lib/api';
import {
  ApiResponse,
  GradeItem,
  SalaryGradeItem,
  SalaryGradeJenjangItem,
  MasterJenjangItem,
  HeadcountSummary,
  MasterCompany,
  MasterSite,
  MasterDepartment,
  MasterSection,
  OrganizationUnitNode,
  PositionItem,
  ReferenceItem,
  ShiftItem,
  WorkScheduleItem,
  EmploymentTypeItem,
  BenefitPlafondItem,
  LevelWorkRosterItem,
  PositionWorkTimeItem,
  PublicHolidayItem,
  PaidLeavePolicyItem,
  WarningLetterDurationItem,
  TerminationTypeItem,
  ResignationTypeItem,
} from '@/types';

export const companyService = {
  getOverviewCounts: async (params?: { company_id?: string | number; site_id?: string | number }) => {
    const res = await apiClient.get<ApiResponse<{
      companies: number;
      sites: number;
      departments: number;
      sections: number;
      positions: number;
      grades: number;
      salary_grades: number;
      jenjang?: number;
      master_jenjang?: number;
      poh: number;
      work_area: number;
      employment_types?: number;
      marital_statuses?: number;
      plafond_pengobatan?: number;
      plafond_kacamata?: number;
      plafond_persalinan?: number;
      roster_kerja?: number;
      pola_shift?: number;
      waktu_kerja?: number;
      kalender_libur?: number;
      durasi_paid_leave?: number;
      durasi_sp?: number;
      jenis_phk?: number;
      jenis_resign?: number;
      tunjangan_lapangan?: number;
      uang_perdin?: number;
      bantuan_lumpsum?: number;
      bantuan_komunikasi?: number;
      bantuan_perumahan?: number;
    }>>('/admin/master-data/overview-counts', { params });
    return res.data;
  },
  getCompanies: async (params?: { search?: string; status?: string; page?: number; per_page?: number; all?: boolean }) => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/master-data/companies', { params });
    return res.data;
  },
  getCompany: async (id: number) => {
    const res = await apiClient.get<ApiResponse<{ company: MasterCompany; audit_trail: any[] }>>(`/admin/master-data/companies/${id}`);
    return res.data;
  },
  createCompany: async (payload: Partial<MasterCompany>) => {
    const res = await apiClient.post<ApiResponse<MasterCompany>>('/admin/master-data/companies', payload);
    return res.data;
  },
  updateCompany: async (id: number, payload: Partial<MasterCompany>) => {
    const res = await apiClient.put<ApiResponse<MasterCompany>>(`/admin/master-data/companies/${id}`, payload);
    return res.data;
  },
  activateCompany: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<MasterCompany>>(`/admin/master-data/companies/${id}/activate`);
    return res.data;
  },
  deactivateCompany: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<MasterCompany>>(`/admin/master-data/companies/${id}/deactivate`);
    return res.data;
  },
  deleteCompany: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/companies/${id}`);
    return res.data;
  },
};

export const siteService = {
  getSites: async (params?: { company_id?: number; site_type?: string; search?: string; status?: string; per_page?: number; all?: boolean }) => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/master-data/sites', { params });
    return res.data;
  },
  getSite: async (id: number) => {
    const res = await apiClient.get<ApiResponse<{ site: MasterSite; audit_trail: any[] }>>(`/admin/master-data/sites/${id}`);
    return res.data;
  },
  createSite: async (payload: Partial<MasterSite>) => {
    const res = await apiClient.post<ApiResponse<MasterSite>>('/admin/master-data/sites', payload);
    return res.data;
  },
  updateSite: async (id: number, payload: Partial<MasterSite>) => {
    const res = await apiClient.put<ApiResponse<MasterSite>>(`/admin/master-data/sites/${id}`, payload);
    return res.data;
  },
  activateSite: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<MasterSite>>(`/admin/master-data/sites/${id}/activate`);
    return res.data;
  },
  deactivateSite: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<MasterSite>>(`/admin/master-data/sites/${id}/deactivate`);
    return res.data;
  },
  deleteSite: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/sites/${id}`);
    return res.data;
  },
};

export const departmentService = {
  getDepartments: async (params?: { company_id?: number; site_id?: number; search?: string; status?: string; per_page?: number; page?: number; all?: boolean }) => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/master-data/departments', { params });
    return res.data;
  },
  getDepartment: async (id: number) => {
    const res = await apiClient.get<ApiResponse<{ department: MasterDepartment; audit_trail: any[] }>>(`/admin/master-data/departments/${id}`);
    return res.data;
  },
  createDepartment: async (payload: Partial<MasterDepartment>) => {
    const res = await apiClient.post<ApiResponse<MasterDepartment>>('/admin/master-data/departments', payload);
    return res.data;
  },
  updateDepartment: async (id: number, payload: Partial<MasterDepartment>) => {
    const res = await apiClient.put<ApiResponse<MasterDepartment>>(`/admin/master-data/departments/${id}`, payload);
    return res.data;
  },
  activateDepartment: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<MasterDepartment>>(`/admin/master-data/departments/${id}/activate`);
    return res.data;
  },
  deactivateDepartment: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<MasterDepartment>>(`/admin/master-data/departments/${id}/deactivate`);
    return res.data;
  },
  deleteDepartment: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/departments/${id}`);
    return res.data;
  },
};

export const sectionService = {
  getSections: async (params?: { department_id?: number; company_id?: number; site_id?: number; search?: string; status?: string; per_page?: number; page?: number; all?: boolean }) => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/master-data/sections', { params });
    return res.data;
  },
  getSection: async (id: number) => {
    const res = await apiClient.get<ApiResponse<{ section: MasterSection; audit_trail: any[] }>>(`/admin/master-data/sections/${id}`);
    return res.data;
  },
  createSection: async (payload: Partial<MasterSection>) => {
    const res = await apiClient.post<ApiResponse<MasterSection>>('/admin/master-data/sections', payload);
    return res.data;
  },
  updateSection: async (id: number, payload: Partial<MasterSection>) => {
    const res = await apiClient.put<ApiResponse<MasterSection>>(`/admin/master-data/sections/${id}`, payload);
    return res.data;
  },
  activateSection: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<MasterSection>>(`/admin/master-data/sections/${id}/activate`);
    return res.data;
  },
  deactivateSection: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<MasterSection>>(`/admin/master-data/sections/${id}/deactivate`);
    return res.data;
  },
  deleteSection: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/sections/${id}`);
    return res.data;
  },
};

export const organizationUnitService = {
  getTree: async (params?: { company_id?: number; status?: string }) => {
    const res = await apiClient.get<ApiResponse<OrganizationUnitNode[]>>('/admin/master-data/organization-units/tree', { params });
    return res.data;
  },
  getUnits: async (params?: { company_id?: number; site_id?: number; parent_id?: number; type?: string; search?: string; per_page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ data: OrganizationUnitNode[]; total: number }>>('/admin/master-data/organization-units', { params });
    return res.data;
  },
  getUnit: async (id: number) => {
    const res = await apiClient.get<ApiResponse<{ unit: OrganizationUnitNode; breadcrumbs: any[]; audit_trail: any[] }>>(`/admin/master-data/organization-units/${id}`);
    return res.data;
  },
  createUnit: async (payload: Partial<OrganizationUnitNode>) => {
    const res = await apiClient.post<ApiResponse<OrganizationUnitNode>>('/admin/master-data/organization-units', payload);
    return res.data;
  },
  updateUnit: async (id: number, payload: Partial<OrganizationUnitNode>) => {
    const res = await apiClient.put<ApiResponse<OrganizationUnitNode>>(`/admin/master-data/organization-units/${id}`, payload);
    return res.data;
  },
  deleteUnit: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/organization-units/${id}`);
    return res.data;
  },
  moveUnit: async (id: number, newParentId: number | null) => {
    const res = await apiClient.post<ApiResponse<OrganizationUnitNode>>(`/admin/master-data/organization-units/${id}/move`, { new_parent_id: newParentId });
    return res.data;
  },
  activateUnit: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<OrganizationUnitNode>>(`/admin/master-data/organization-units/${id}/activate`);
    return res.data;
  },
  deactivateUnit: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<OrganizationUnitNode>>(`/admin/master-data/organization-units/${id}/deactivate`);
    return res.data;
  },
};

export const positionService = {
  getPositions: async (params?: { company_id?: number; site_id?: number; department_id?: number; section_id?: number; organization_unit_id?: number; grade_id?: number; is_frozen?: boolean; search?: string; status?: string; per_page?: number; all?: boolean }) => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/master-data/positions', { params });
    return res.data;
  },
  getSummary: async (params?: { organization_unit_id?: number }) => {
    const res = await apiClient.get<ApiResponse<HeadcountSummary>>('/admin/master-data/positions/summary', { params });
    return res.data;
  },
  getPosition: async (id: number) => {
    const res = await apiClient.get<ApiResponse<{ position: PositionItem; audit_trail: any[] }>>(`/admin/master-data/positions/${id}`);
    return res.data;
  },
  createPosition: async (payload: Partial<PositionItem>) => {
    const res = await apiClient.post<ApiResponse<PositionItem>>('/admin/master-data/positions', payload);
    return res.data;
  },
  updatePosition: async (id: number, payload: Partial<PositionItem>) => {
    const res = await apiClient.put<ApiResponse<PositionItem>>(`/admin/master-data/positions/${id}`, payload);
    return res.data;
  },
  toggleFreeze: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<PositionItem>>(`/admin/master-data/positions/${id}/freeze`);
    return res.data;
  },
  activatePosition: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<PositionItem>>(`/admin/master-data/positions/${id}/activate`);
    return res.data;
  },
  deactivatePosition: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<PositionItem>>(`/admin/master-data/positions/${id}/deactivate`);
    return res.data;
  },
  deletePosition: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/positions/${id}`);
    return res.data;
  },
};

export const jobGradeService = {
  getJobFamilies: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/job-families');
    return res.data;
  },
  createJobFamily: async (payload: any) => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/master-data/job-families', payload);
    return res.data;
  },
  getJobs: async (params?: { job_family_id?: number }) => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/jobs', { params });
    return res.data;
  },
  createJob: async (payload: any) => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/master-data/jobs', payload);
    return res.data;
  },
  getGrades: async (params?: { search?: string; pangkat?: string; status?: string }) => {
    const res = await apiClient.get<ApiResponse<GradeItem[]>>('/admin/master-data/grades', { params });
    return res.data;
  },
  createGrade: async (payload: Partial<GradeItem>) => {
    const res = await apiClient.post<ApiResponse<GradeItem>>('/admin/master-data/grades', payload);
    return res.data;
  },
  updateGrade: async (id: number, payload: Partial<GradeItem>) => {
    const res = await apiClient.put<ApiResponse<GradeItem>>(`/admin/master-data/grades/${id}`, payload);
    return res.data;
  },
  deleteGrade: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/grades/${id}`);
    return res.data;
  },
  getWorkLocations: async (params?: { site_id?: number }) => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/work-locations', { params });
    return res.data;
  },
  createWorkLocation: async (payload: any) => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/master-data/work-locations', payload);
    return res.data;
  },
  getCostCenters: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/cost-centers');
    return res.data;
  },
  createCostCenter: async (payload: any) => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/master-data/cost-centers', payload);
    return res.data;
  },
};

export const salaryGradeService = {
  getSalaryGrades: async (params?: { search?: string; level_id?: number; status?: string }) => {
    const res = await apiClient.get<ApiResponse<SalaryGradeItem[]>>('/admin/master-data/salary-grades', { params });
    return res.data;
  },
  createSalaryGrade: async (payload: Partial<SalaryGradeItem>) => {
    const res = await apiClient.post<ApiResponse<SalaryGradeItem>>('/admin/master-data/salary-grades', payload);
    return res.data;
  },
  updateSalaryGrade: async (id: number, payload: Partial<SalaryGradeItem>) => {
    const res = await apiClient.put<ApiResponse<SalaryGradeItem>>(`/admin/master-data/salary-grades/${id}`, payload);
    return res.data;
  },
  deleteSalaryGrade: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/salary-grades/${id}`);
    return res.data;
  },
};

export const jenjangService = {
  getJenjangs: async (params?: { search?: string; salary_grade_id?: number; grade_id?: number; status?: string }) => {
    const res = await apiClient.get<ApiResponse<SalaryGradeJenjangItem[]>>('/admin/master-data/jenjang', { params });
    return res.data;
  },
  createJenjang: async (payload: Partial<SalaryGradeJenjangItem>) => {
    const res = await apiClient.post<ApiResponse<SalaryGradeJenjangItem>>('/admin/master-data/jenjang', payload);
    return res.data;
  },
  updateJenjang: async (id: number, payload: Partial<SalaryGradeJenjangItem>) => {
    const res = await apiClient.put<ApiResponse<SalaryGradeJenjangItem>>(`/admin/master-data/jenjang/${id}`, payload);
    return res.data;
  },
  deleteJenjang: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/jenjang/${id}`);
    return res.data;
  },
};

export const masterJenjangService = {
  getMasterJenjangs: async (params?: { search?: string; status?: string }) => {
    const res = await apiClient.get<ApiResponse<MasterJenjangItem[]>>('/admin/master-data/master-jenjang', { params });
    return res.data;
  },
  createMasterJenjang: async (payload: Partial<MasterJenjangItem>) => {
    const res = await apiClient.post<ApiResponse<MasterJenjangItem>>('/admin/master-data/master-jenjang', payload);
    return res.data;
  },
  updateMasterJenjang: async (id: number, payload: Partial<MasterJenjangItem>) => {
    const res = await apiClient.put<ApiResponse<MasterJenjangItem>>(`/admin/master-data/master-jenjang/${id}`, payload);
    return res.data;
  },
  deleteMasterJenjang: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/master-jenjang/${id}`);
    return res.data;
  },
};

export const employmentMasterService = {
  getEmploymentTypes: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/employment-types');
    return res.data;
  },
  getEmploymentStatuses: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/employment-statuses');
    return res.data;
  },
  getWorkerCategories: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/worker-categories');
    return res.data;
  },
  getEmployeeGroups: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/employee-groups');
    return res.data;
  },
  getContractTypes: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/contract-types');
    return res.data;
  },
};

export const scheduleMasterService = {
  getShifts: async () => {
    const res = await apiClient.get<ApiResponse<ShiftItem[]>>('/admin/master-data/shifts');
    return res.data;
  },
  createShift: async (payload: Partial<ShiftItem>) => {
    const res = await apiClient.post<ApiResponse<ShiftItem>>('/admin/master-data/shifts', payload);
    return res.data;
  },
  getWorkSchedules: async () => {
    const res = await apiClient.get<ApiResponse<WorkScheduleItem[]>>('/admin/master-data/work-schedules');
    return res.data;
  },
  createWorkSchedule: async (payload: Partial<WorkScheduleItem>) => {
    const res = await apiClient.post<ApiResponse<WorkScheduleItem>>('/admin/master-data/work-schedules', payload);
    return res.data;
  },
  getHolidayCalendars: async (params?: { year?: number }) => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/holiday-calendars', { params });
    return res.data;
  },
  getWorkCalendars: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/work-calendars');
    return res.data;
  },
  deleteShift: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/shifts/${id}`);
    return res.data;
  },
  updateShift: async (id: number, payload: Partial<ShiftItem>) => {
    const res = await apiClient.put<ApiResponse<ShiftItem>>(`/admin/master-data/shifts/${id}`, payload);
    return res.data;
  },
  deleteWorkSchedule: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/work-schedules/${id}`);
    return res.data;
  },
  updateWorkSchedule: async (id: number, payload: Partial<WorkScheduleItem>) => {
    const res = await apiClient.put<ApiResponse<WorkScheduleItem>>(`/admin/master-data/work-schedules/${id}`, payload);
    return res.data;
  },
};

export const referenceDataService = {
  getGeographic: async (params?: { type?: string; parent_id?: number }) => {
    const res = await apiClient.get<ApiResponse<ReferenceItem[]>>('/admin/master-data/geographic', { params });
    return res.data;
  },
  getStandard: async (category?: string) => {
    const res = await apiClient.get<ApiResponse<ReferenceItem[]>>('/admin/master-data/standard', { params: { category } });
    return res.data;
  },
  createStandard: async (payload: any) => {
    const res = await apiClient.post<ApiResponse<ReferenceItem>>('/admin/master-data/standard', payload);
    return res.data;
  },
  updateStandard: async (id: number, payload: any) => {
    const res = await apiClient.put<ApiResponse<ReferenceItem>>(`/admin/master-data/standard/${id}`, payload);
    return res.data;
  },
  deleteStandard: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/standard/${id}`);
    return res.data;
  },
  getDocumentTypes: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/document-types');
    return res.data;
  },
  createDocumentType: async (payload: any) => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/master-data/document-types', payload);
    return res.data;
  },
  updateDocumentType: async (id: number, payload: any) => {
    const res = await apiClient.put<ApiResponse<any>>(`/admin/master-data/document-types/${id}`, payload);
    return res.data;
  },
  deleteDocumentType: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/document-types/${id}`);
    return res.data;
  },
  getTerminationReasons: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/termination-reasons');
    return res.data;
  },
  getLeaveTypes: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/leave-types');
    return res.data;
  },
  getOvertimeTypes: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/overtime-types');
    return res.data;
  },
};

export const employmentTypeService = {
  getEmploymentTypes: async (params?: { search?: string; status?: string; per_page?: number }) => {
    const res = await apiClient.get<ApiResponse<EmploymentTypeItem[]>>('/admin/master-data/employment-types', { params });
    return res.data;
  },
  getEmploymentType: async (id: number) => {
    const res = await apiClient.get<ApiResponse<EmploymentTypeItem>>(`/admin/master-data/employment-types/${id}`);
    return res.data;
  },
  createEmploymentType: async (payload: Partial<EmploymentTypeItem>) => {
    const res = await apiClient.post<ApiResponse<EmploymentTypeItem>>('/admin/master-data/employment-types', payload);
    return res.data;
  },
  updateEmploymentType: async (id: number, payload: Partial<EmploymentTypeItem>) => {
    const res = await apiClient.put<ApiResponse<EmploymentTypeItem>>(`/admin/master-data/employment-types/${id}`, payload);
    return res.data;
  },
  deleteEmploymentType: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/employment-types/${id}`);
    return res.data;
  },
  activateEmploymentType: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<EmploymentTypeItem>>(`/admin/master-data/employment-types/${id}/activate`);
    return res.data;
  },
  deactivateEmploymentType: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<EmploymentTypeItem>>(`/admin/master-data/employment-types/${id}/deactivate`);
    return res.data;
  },
};

export const benefitPlafondService = {
  getBenefitPlafonds: async (params?: {
    benefit_type?: 'PENGOBATAN' | 'KACAMATA' | 'PERSALINAN' | string;
    salary_grade_id?: number | string;
    grade_id?: number | string;
    lens_type?: string;
    marital_category?: string;
    status?: string;
    search?: string;
    per_page?: number;
  }) => {
    const res = await apiClient.get<ApiResponse<BenefitPlafondItem[]>>('/admin/master-data/benefit-plafonds', { params });
    return res.data;
  },
  getBenefitPlafond: async (id: number) => {
    const res = await apiClient.get<ApiResponse<BenefitPlafondItem>>(`/admin/master-data/benefit-plafonds/${id}`);
    return res.data;
  },
  createBenefitPlafond: async (payload: Partial<BenefitPlafondItem>) => {
    const res = await apiClient.post<ApiResponse<BenefitPlafondItem>>('/admin/master-data/benefit-plafonds', payload);
    return res.data;
  },
  updateBenefitPlafond: async (id: number, payload: Partial<BenefitPlafondItem>) => {
    const res = await apiClient.put<ApiResponse<BenefitPlafondItem>>(`/admin/master-data/benefit-plafonds/${id}`, payload);
    return res.data;
  },
  deleteBenefitPlafond: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/benefit-plafonds/${id}`);
    return res.data;
  },
  activateBenefitPlafond: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<BenefitPlafondItem>>(`/admin/master-data/benefit-plafonds/${id}/activate`);
    return res.data;
  },
  deactivateBenefitPlafond: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<BenefitPlafondItem>>(`/admin/master-data/benefit-plafonds/${id}/deactivate`);
    return res.data;
  },
};

export const customMasterService = {
  getCategories: async () => {
    const res = await apiClient.get<ApiResponse<any[]>>('/admin/master-data/custom');
    return res.data;
  },
  createCategory: async (payload: { code: string; name: string; description?: string }) => {
    const res = await apiClient.post<ApiResponse<any>>('/admin/master-data/custom/categories', payload);
    return res.data;
  },
  getCategory: async (id: number) => {
    const res = await apiClient.get<ApiResponse<any>>(`/admin/master-data/custom/categories/${id}`);
    return res.data;
  },
  createValue: async (categoryId: number, payload: { code: string; name: string; order?: number }) => {
    const res = await apiClient.post<ApiResponse<any>>(`/admin/master-data/custom/categories/${categoryId}/values`, payload);
    return res.data;
  },
  deleteValue: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/custom/values/${id}`);
    return res.data;
  },
};

export const importExportService = {
  uploadAndInspect: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<{ headers: string[]; total_rows: number; sample_rows: string[][]; all_rows: string[][] }>>(
      '/admin/master-data/import/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },
  validateImport: async (payload: { entity: string; headers: string[]; rows: string[][]; mapping: Record<string, string> }) => {
    const res = await apiClient.post<ApiResponse<{ is_valid: boolean; total: number; valid_count: number; error_count: number; errors: any[]; valid_data: any[] }>>(
      '/admin/master-data/import/validate',
      payload
    );
    return res.data;
  },
  executeImport: async (payload: { entity: string; data: any[]; strategy?: string }) => {
    const res = await apiClient.post<ApiResponse<{ success: boolean; imported_count: number }>>(
      '/admin/master-data/import/execute',
      payload
    );
    return res.data;
  },
  downloadExport: async (entity: string, customFilename?: string) => {
    const response = await apiClient.get(`/admin/master-data/export/${entity}`, {
      responseType: 'blob',
    });

    let filename = customFilename || `export_${entity}_${new Date().toISOString().slice(0, 10)}.csv`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  },
  downloadTemplate: async (entity: string) => {
    const response = await apiClient.get(`/admin/master-data/import/template/${entity}`, {
      responseType: 'blob',
    });

    let filename = `template_impor_${entity}.csv`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  },
  getHistory: async () => {
    const res = await apiClient.get<ApiResponse<Array<{
      id: number;
      action: 'IMPORT' | 'EXPORT';
      module: string;
      actor: string;
      username: string;
      filename: string;
      imported_count: number | null;
      ip_address: string;
      created_at: string;
      time_ago: string;
    }>>>('/admin/master-data/import-export/history');
    return res.data;
  },
  getExportUrl: (entity: string) => {
    const baseUrl = (typeof window !== 'undefined'
      ? '/api/v1'
      : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1')
    ).replace(/\/+$/, '');
    let token = '';
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token') || '';
    }
    return `${baseUrl}/admin/master-data/export/${entity}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
};

// ================= 7 EXTENSION MASTER SERVICES =================
export const levelRosterService = {
  getLevelRosters: async (params?: { level?: number; poh_type?: string; status?: string; search?: string; per_page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ data: LevelWorkRosterItem[]; total: number }>>('/admin/master-data/level-rosters', { params });
    return res.data;
  },
  createLevelRoster: async (payload: Partial<LevelWorkRosterItem>) => {
    const res = await apiClient.post<ApiResponse<LevelWorkRosterItem>>('/admin/master-data/level-rosters', payload);
    return res.data;
  },
  updateLevelRoster: async (id: number, payload: Partial<LevelWorkRosterItem>) => {
    const res = await apiClient.put<ApiResponse<LevelWorkRosterItem>>(`/admin/master-data/level-rosters/${id}`, payload);
    return res.data;
  },
  deleteLevelRoster: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/level-rosters/${id}`);
    return res.data;
  },
};

export const positionWorkTimeService = {
  getPositionWorkTimes: async (params?: { work_type?: string; position_id?: number; status?: string; search?: string; per_page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ data: PositionWorkTimeItem[]; total: number }>>('/admin/master-data/position-work-times', { params });
    return res.data;
  },
  createPositionWorkTime: async (payload: Partial<PositionWorkTimeItem>) => {
    const res = await apiClient.post<ApiResponse<PositionWorkTimeItem>>('/admin/master-data/position-work-times', payload);
    return res.data;
  },
  updatePositionWorkTime: async (id: number, payload: Partial<PositionWorkTimeItem>) => {
    const res = await apiClient.put<ApiResponse<PositionWorkTimeItem>>(`/admin/master-data/position-work-times/${id}`, payload);
    return res.data;
  },
  deletePositionWorkTime: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/position-work-times/${id}`);
    return res.data;
  },
};

export const publicHolidayService = {
  getPublicHolidays: async (params?: { year?: number; type?: string; status?: string; search?: string; per_page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ data: PublicHolidayItem[]; total: number }>>('/admin/master-data/public-holidays', { params });
    return res.data;
  },
  createPublicHoliday: async (payload: Partial<PublicHolidayItem>) => {
    const res = await apiClient.post<ApiResponse<PublicHolidayItem>>('/admin/master-data/public-holidays', payload);
    return res.data;
  },
  updatePublicHoliday: async (id: number, payload: Partial<PublicHolidayItem>) => {
    const res = await apiClient.put<ApiResponse<PublicHolidayItem>>(`/admin/master-data/public-holidays/${id}`, payload);
    return res.data;
  },
  deletePublicHoliday: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/public-holidays/${id}`);
    return res.data;
  },
};

export const paidLeavePolicyService = {
  getPaidLeavePolicies: async (params?: { category?: string; status?: string; search?: string; per_page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ data: PaidLeavePolicyItem[]; total: number }>>('/admin/master-data/paid-leave-policies', { params });
    return res.data;
  },
  createPaidLeavePolicy: async (payload: Partial<PaidLeavePolicyItem>) => {
    const res = await apiClient.post<ApiResponse<PaidLeavePolicyItem>>('/admin/master-data/paid-leave-policies', payload);
    return res.data;
  },
  updatePaidLeavePolicy: async (id: number, payload: Partial<PaidLeavePolicyItem>) => {
    const res = await apiClient.put<ApiResponse<PaidLeavePolicyItem>>(`/admin/master-data/paid-leave-policies/${id}`, payload);
    return res.data;
  },
  deletePaidLeavePolicy: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/paid-leave-policies/${id}`);
    return res.data;
  },
};

export const warningLetterDurationService = {
  getWarningLetterDurations: async (params?: { level?: string; status?: string; search?: string; per_page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ data: WarningLetterDurationItem[]; total: number }>>('/admin/master-data/warning-letter-durations', { params });
    return res.data;
  },
  createWarningLetterDuration: async (payload: Partial<WarningLetterDurationItem>) => {
    const res = await apiClient.post<ApiResponse<WarningLetterDurationItem>>('/admin/master-data/warning-letter-durations', payload);
    return res.data;
  },
  updateWarningLetterDuration: async (id: number, payload: Partial<WarningLetterDurationItem>) => {
    const res = await apiClient.put<ApiResponse<WarningLetterDurationItem>>(`/admin/master-data/warning-letter-durations/${id}`, payload);
    return res.data;
  },
  deleteWarningLetterDuration: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/warning-letter-durations/${id}`);
    return res.data;
  },
};

export const terminationTypeService = {
  getTerminationTypes: async (params?: { status?: string; search?: string; per_page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ data: TerminationTypeItem[]; total: number }>>('/admin/master-data/termination-types', { params });
    return res.data;
  },
  createTerminationType: async (payload: Partial<TerminationTypeItem>) => {
    const res = await apiClient.post<ApiResponse<TerminationTypeItem>>('/admin/master-data/termination-types', payload);
    return res.data;
  },
  updateTerminationType: async (id: number, payload: Partial<TerminationTypeItem>) => {
    const res = await apiClient.put<ApiResponse<TerminationTypeItem>>(`/admin/master-data/termination-types/${id}`, payload);
    return res.data;
  },
  deleteTerminationType: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/termination-types/${id}`);
    return res.data;
  },
};

export const resignationTypeService = {
  getResignationTypes: async (params?: { status?: string; search?: string; per_page?: number }) => {
    const res = await apiClient.get<ApiResponse<{ data: ResignationTypeItem[]; total: number }>>('/admin/master-data/resignation-types', { params });
    return res.data;
  },
  createResignationType: async (payload: Partial<ResignationTypeItem>) => {
    const res = await apiClient.post<ApiResponse<ResignationTypeItem>>('/admin/master-data/resignation-types', payload);
    return res.data;
  },
  updateResignationType: async (id: number, payload: Partial<ResignationTypeItem>) => {
    const res = await apiClient.put<ApiResponse<ResignationTypeItem>>(`/admin/master-data/resignation-types/${id}`, payload);
    return res.data;
  },
  deleteResignationType: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/admin/master-data/resignation-types/${id}`);
    return res.data;
  },
};

