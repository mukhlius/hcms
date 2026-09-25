export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
  request_id: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
  request_id: string;
}

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED' | 'SUSPENDED' | 'PENDING';
export type DataScope = 'SELF' | 'SUBORDINATES' | 'DEPARTMENT' | 'SITE' | 'COMPANY' | 'GLOBAL';

export interface User {
  id: number;
  uuid: string;
  username: string;
  name: string;
  email: string;
  status: UserStatus;
  failed_login_attempts?: number;
  locked_until?: string | null;
  password_changed_at?: string | null;
  force_password_change?: boolean;
  company_id?: number | null;
  site_id?: number | null;
  department_id?: number | null;
  company?: { id: number; name: string } | null;
  site?: { id: number; name: string } | null;
  department?: { id: number; name: string } | null;
  roles?: Role[];
  permissions?: string[];
  data_scope?: DataScope;
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string | null;
  data_scope: DataScope;
  is_system?: boolean;
  permissions_count?: number;
  users_count?: number;
  permissions?: Permission[];
  created_at?: string;
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  group: string;
  description?: string | null;
}

export interface UserSession {
  id: string;
  user_id: number;
  token_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  device?: string | null;
  browser?: string | null;
  operating_system?: string | null;
  last_activity_at?: string | null;
  revoked_at?: string | null;
  user?: User;
  created_at: string;
}

export interface LoginHistory {
  id: number;
  user_id?: number | null;
  identifier: string;
  ip_address?: string | null;
  user_agent?: string | null;
  device?: string | null;
  browser?: string | null;
  operating_system?: string | null;
  status: 'SUCCESS' | 'FAILED' | 'LOCKED' | 'LOGOUT';
  failure_reason?: string | null;
  logged_in_at?: string | null;
  created_at: string;
}

export interface SecurityEvent {
  id: number;
  user_id?: number | null;
  actor_id?: number | null;
  event_type: string;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, any> | null;
  request_id?: string | null;
  user?: User | null;
  actor?: User | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_id?: number | null;
  action: string;
  module: string;
  entity_type?: string | null;
  entity_id?: string | null;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  request_id?: string | null;
  actor?: User | null;
  created_at: string;
}

export interface SystemSetting {
  id: number;
  category: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string | null;
  is_public: boolean;
  updated_at: string;
}

export interface OrganizationMetadata {
  companies: Array<{ id: number; name: string; code: string; is_active: boolean }>;
  sites: Array<{ id: number; company_id: number; name: string; code: string; is_active: boolean }>;
  departments: Array<{ id: number; site_id: number; name: string; code: string; is_active: boolean }>;
}

// ================= PHASE 2 TYPES =================

export interface MasterCompany {
  id: number;
  code: string;
  name: string;
  legal_name?: string | null;
  short_name?: string | null;
  description?: string | null;
  tax_identifier?: string | null;
  address?: string | null;
  country: string;
  currency: string;
  timezone: string;
  status: 'ACTIVE' | 'INACTIVE';
  effective_from?: string | null;
  effective_to?: string | null;
  sites_count?: number;
  organization_units_count?: number;
  sites?: MasterSite[];
  created_at?: string;
  updated_at?: string;
}

export interface MasterSite {
  id: number;
  company_id: number;
  code: string;
  name: string;
  short_name?: string | null;
  site_type: 'MINING_SITE' | 'HEAD_OFFICE' | 'BRANCH_OFFICE' | 'WAREHOUSE' | 'REMOTE_CAMP' | 'PROJECT_SITE';
  description?: string | null;
  location?: string | null;
  address?: string | null;
  country: string;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone: string;
  status: 'ACTIVE' | 'INACTIVE';
  company?: MasterCompany;
  work_locations_count?: number;
  departments_count?: number;
  created_at?: string;
}

export interface MasterDepartment {
  id: number;
  company_id: number;
  site_id?: number | null;
  code: string;
  name: string;
  description?: string | null;
  leader_user_id?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  is_active?: boolean;
  company?: MasterCompany;
  site?: MasterSite;
  leader?: { id: number; name: string; email?: string } | null;
  sections_count?: number;
  users_count?: number;
  sections?: MasterSection[];
  created_at?: string;
  updated_at?: string;
}

export interface MasterSection {
  id: number;
  company_id: number;
  department_id: number;
  site_id?: number | null;
  code: string;
  name: string;
  description?: string | null;
  leader_user_id?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  company?: MasterCompany;
  department?: MasterDepartment;
  site?: MasterSite;
  leader?: { id: number; name: string; email?: string } | null;
  users_count?: number;
  positions_count?: number;
  created_at?: string;
  updated_at?: string;
}

export type OrgUnitType = 'BUSINESS_UNIT' | 'DIVISION' | 'DEPARTMENT' | 'SECTION' | 'SUB_SECTION' | 'OTHER';

export interface OrganizationUnitNode {
  id: number;
  company_id: number;
  site_id?: number | null;
  parent_id?: number | null;
  type: OrgUnitType;
  code: string;
  name: string;
  description?: string | null;
  leader_user_id?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  effective_from?: string | null;
  effective_to?: string | null;
  leader?: { id: number; name: string; email: string } | null;
  parent?: { id: number; code: string; name: string; type: OrgUnitType } | null;
  company?: { id: number; code: string; name: string } | null;
  site?: { id: number; code: string; name: string } | null;
  children_count?: number;
  positions_count?: number;
  children?: OrganizationUnitNode[];
  positions?: PositionItem[];
}

export interface PositionItem {
  id: number;
  code: string;
  title: string;
  short_title?: string | null;
  site_id?: number | null;
  department_id?: number | null;
  section_id?: number | null;
  organization_unit_id?: number | null;
  job_id?: number | null;
  job_family_id?: number | null;
  grade_id?: number | null;
  reports_to_position_id?: number | null;
  location_id?: number | null;
  cost_center_id?: number | null;
  approved_headcount: number;
  current_headcount: number;
  vacancy_headcount: number;
  is_frozen: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  site?: MasterSite | null;
  department?: MasterDepartment | null;
  section?: MasterSection | null;
  organization_unit?: OrganizationUnitNode;
  job?: { id: number; code: string; name: string };
  job_family?: { id: number; code: string; name: string };
  grade?: { id: number; code: string; name: string; level: number; pangkat?: string };
  reports_to?: { id: number; code: string; title: string };
  reportsTo?: { id: number; code: string; title: string };
  work_location?: { id: number; code: string; name: string };
  cost_center?: { id: number; code: string; name: string };
  subordinates?: PositionItem[];
}

export interface HeadcountSummary {
  total_positions: number;
  approved_headcount: number;
  current_headcount: number;
  vacant_headcount: number;
  frozen_positions: number;
  occupancy_rate: number;
}

export interface ShiftItem {
  id: number;
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  break_start?: string | null;
  break_end?: string | null;
  cross_day: boolean;
  grace_period_minutes: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface WorkScheduleItem {
  id: number;
  code: string;
  name: string;
  pattern_type: 'ROSTER' | 'FIXED' | 'ROTATING';
  cycle_days: number;
  days_on: number;
  days_off: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface GradeItem {
  id: number;
  code: string;
  name: string;
  level: number;
  pangkat?: 'Staff' | 'Non Staff' | string | null;
  min_salary?: number | null;
  max_salary?: number | null;
  field_duty_duration_days?: number | null;
  field_leave_duration_days?: number | null;
  field_allowance?: number | null;
  leave_lumpsum_allowance?: number | null;
  business_trip_allowance_daily?: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface SalaryGradeItem {
  id: number;
  code: string;
  name: string;
  housing_allowance?: number | null;
  level_id?: number | null;
  level?: GradeItem | null;
  min_salary?: number | null;
  mid_salary?: number | null;
  max_salary?: number | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface MasterJenjangItem {
  id: number;
  code: string;
  name: string;
  level?: number | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  salary_grade_jenjangs_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SalaryGradeJenjangItem {
  id: number;
  salary_grade_id: number;
  salary_grade?: SalaryGradeItem | null;
  grade_id: number;
  grade?: GradeItem | null;
  master_jenjang_id?: number | null;
  master_jenjang?: MasterJenjangItem | null;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface ReferenceItem {
  id: number;
  category?: string;
  type?: string;
  code: string;
  name: string;
  status?: string;
  metadata?: any;
}

export interface EmploymentTypeItem {
  id: number;
  code: string;
  name: string;
  is_permanent?: boolean;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface BenefitPlafondItem {
  id: number;
  benefit_type: 'PENGOBATAN' | 'KACAMATA' | 'PERSALINAN' | 'TUNJANGAN_LAPANGAN' | 'UANG_PERDIN' | 'BANTUAN_LUMPSUM' | 'BANTUAN_KOMUNIKASI' | 'BANTUAN_PERUMAHAN';
  salary_grade_id?: number | null;
  grade_id?: number | null;
  salary_grade_jenjang_id?: number | null;
  master_jenjang_id?: number | null;
  position_id?: number | null;
  lens_type?: string | null;
  frame_amount?: number | null;
  lens_amount?: number | null;
  category_name?: string | null;
  zone_name?: string | null;
  marital_category: 'Menikah' | 'Tidak Menikah' | 'SEMUA';
  marital_status_id?: number | null;
  amount: number;
  period_type: 'HARIAN' | 'BULANAN' | 'TAHUNAN' | 'PER_KASUS' | '2_TAHUNAN' | 'SEUMUR_HIDUP';
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  salary_grade?: SalaryGradeItem | null;
  grade?: SalaryGradeItem | GradeItem | null;
  jenjang?: SalaryGradeJenjangItem | null;
  master_jenjang?: MasterJenjangItem | null;
  position?: PositionItem | null;
  marital_status?: ReferenceItem | null;
  created_at?: string;
  updated_at?: string;
}

export interface LevelWorkRosterItem {
  id: number;
  level: number;
  grade_id?: number | null;
  work_schedule_id?: number | null;
  roster_name: string;
  days_on: number;
  days_off: number;
  poh_type: 'ALL' | 'LOKAL' | 'NON_LOKAL';
  travel_days: number;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  grade?: GradeItem | null;
  work_schedule?: WorkScheduleItem | null;
  created_at?: string;
  updated_at?: string;
}

export interface PositionWorkTimeItem {
  id: number;
  position_id: number;
  shift_id?: number | null;
  shift_type?: 'DAY' | 'NIGHT' | 'CUSTOM' | null;
  work_schedule_id?: number | null;
  work_type: 'SHIFT' | 'NON_SHIFT' | 'FLEXIBLE';
  start_time?: string | null;
  end_time?: string | null;
  late_tolerance_minutes?: number | null;
  early_out_tolerance_minutes?: number | null;
  daily_hours: number;
  weekly_days: number;
  break_minutes: number;
  is_overtime_eligible: boolean;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  position?: PositionItem | null;
  shift?: ShiftItem | null;
  work_schedule?: WorkScheduleItem | null;
  created_at?: string;
  updated_at?: string;
}

export interface PublicHolidayItem {
  id: number;
  holiday_date: string;
  name: string;
  type: 'HARI_LIBUR_NASIONAL' | 'CUTI_BERSAMA' | 'LIBUR_KHUSUS_SITE';
  year: number;
  is_recurring: boolean;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface PaidLeavePolicyItem {
  id: number;
  code: string;
  name: string;
  category: 'ANNUAL' | 'MATERNITY' | 'FAMILY_EVENT' | 'RELIGIOUS' | 'MEDICAL' | 'OTHER';
  duration_days: number;
  duration_unit: 'HARI_KERJA' | 'HARI_KALENDER' | 'BULAN';
  requires_document: boolean;
  required_document_name?: string | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface WarningLetterDurationItem {
  id: number;
  code: string;
  level: 'TEGURAN' | 'SP_1' | 'SP_2' | 'SP_3';
  name: string;
  duration_months: number;
  validity_unit: string;
  consequence_description?: string | null;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface TerminationTypeItem {
  id: number;
  code: string;
  name: string;
  legal_basis?: string | null;
  pesangon_multiplier: number;
  pmtk_multiplier: number;
  entitled_to_uph: boolean;
  entitled_to_uang_pisah: boolean;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface ResignationTypeItem {
  id: number;
  code: string;
  name: string;
  notice_period_days: number;
  requires_clearance: boolean;
  entitled_to_uang_pisah: boolean;
  entitled_to_sisa_cuti: boolean;
  description?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export * from './employee';

