import { User } from './index';

export interface EmployeeFamily {
  id?: number;
  employee_id?: number;
  relation_type: 'SPOUSE' | 'CHILD' | 'FATHER' | 'MOTHER' | 'FATHER_IN_LAW' | 'MOTHER_IN_LAW' | 'OTHER';
  child_order?: number | null;
  name: string;
  gender?: 'MALE' | 'FEMALE' | null;
  birth_place?: string | null;
  birth_date?: string | null;
  age?: number | null;
  id_card_number?: string | null;
  health_provider_no?: string | null;
  is_covered_insurance?: boolean;
  is_alive?: boolean;
}

export interface EmployeeEducation {
  id?: number;
  employee_id?: number;
  level: string; // SD, SMP, SMA, SMK, D1, D2, D3, D4, S1, S2, S3
  institution_name: string;
  major?: string | null;
  graduation_year?: number | null;
  gpa?: number | null;
  is_highest?: boolean;
}

export interface EmployeeEmergencyContact {
  id?: number;
  employee_id?: number;
  name: string;
  relationship: string;
  phone_number: string;
  address?: string | null;
  is_primary?: boolean;
}

export interface EmployeeHealthSafety {
  id?: number;
  employee_id?: number;
  blood_type?: string | null; // A, B, AB, O
  rhesus?: string | null; // +, -
  height_cm?: number | null;
  weight_kg?: number | null;
  shirt_size?: string | null; // S, M, L, XL, XXL, XXXL
  pants_size?: string | null;
  safety_shoe_size?: string | null;
  coverall_size?: string | null;
  medical_notes?: string | null;
}

export interface EmployeeBankAccount {
  id?: number;
  employee_id?: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_payroll_primary?: boolean;
}

export interface EmployeeCareerHistory {
  id: number;
  employee_id: number;
  movement_type: string;
  letter_number?: string | null;
  letter_date?: string | null;
  effective_date: string;
  end_date?: string | null;
  is_current: boolean;
  
  // Snapshots baku
  position_title_snapshot: string;
  department_name_snapshot: string;
  site_name_snapshot: string;
  grade_name_snapshot?: string | null;
  pangkat_snapshot?: string | null;
  golongan_snapshot?: string | null;
  level_jenjang_snapshot?: string | null;
  poh_snapshot?: string | null;
  work_area_snapshot?: string | null;
  employment_type_snapshot?: string | null;
  
  reason?: string | null;
  notes?: string | null;
  sk_file_url?: string | null;
  approved_by_user_id?: number | null;
  created_at: string;
}

export interface Employee {
  id: number;
  user_id?: number | null;
  nrp: string;
  name: string;
  nickname?: string | null;
  gender: 'MALE' | 'FEMALE';
  birth_place?: string | null;
  birth_date: string;
  age?: number | null;
  religion?: string | null;
  marital_status?: string | null;
  marriage_date?: string | null;
  
  id_card_number?: string | null;
  tax_number?: string | null;
  tax_status?: string | null;
  bpjs_ketenagakerjaan?: string | null;
  bpjs_kesehatan?: string | null;
  insurance_admedika?: string | null;
  
  email_company?: string | null;
  email_personal?: string | null;
  phone_mobile?: string | null;
  phone_home?: string | null;
  
  ktp_address?: string | null;
  ktp_city?: string | null;
  ktp_district?: string | null;
  ktp_province?: string | null;
  ktp_postal_code?: string | null;
  
  residential_address?: string | null;
  residential_city?: string | null;
  residential_district?: string | null;
  residential_province?: string | null;
  residential_postal_code?: string | null;
  
  mailing_address?: string | null;
  mailing_city?: string | null;
  mailing_district?: string | null;
  mailing_province?: string | null;
  mailing_postal_code?: string | null;
  
  company_id?: number | null;
  site_id?: number | null;
  department_id?: number | null;
  section_id?: number | null;
  position_id?: number | null;
  grade_id?: number | null;
  salary_grade_id?: number | null;
  salary_grade_jenjang_id?: number | null;
  pangkat?: string | null;
  employment_type_id?: number | null;
  
  poh?: string | null;
  work_area?: string | null;
  hire_date: string;
  probation_end_date?: string | null;
  contract_end_date?: string | null;
  employment_status: string; // ACTIVE, PROBATION, SUSPENDED, RESIGNED, TERMINATED
  photo_url?: string | null;
  notes?: string | null;
  
  // Relations
  user?: User | null;
  position?: { id: number; code: string; title: string } | null;
  department?: { id: number; code: string; name: string } | null;
  section?: { id: number; code: string; name: string } | null;
  site?: { id: number; code: string; name: string; company_id?: number | null } | null;
  company?: { id: number; code: string; name: string } | null;
  grade?: { id: number; code: string; name: string; pangkat?: string } | null;
  salary_grade?: { id: number; code: string; name: string } | null;
  salary_grade_jenjang?: { id: number; name: string } | null;
  employment_type?: { id: number; code: string; name: string } | null;
  
  families?: EmployeeFamily[];
  educations?: EmployeeEducation[];
  emergency_contacts?: EmployeeEmergencyContact[];
  health_safety?: EmployeeHealthSafety | null;
  bank_accounts?: EmployeeBankAccount[];
  career_histories?: EmployeeCareerHistory[];
  
  created_at: string;
  updated_at: string;
}

export interface EmployeeFilterParams {
  search?: string;
  company_id?: number | string;
  department_id?: number | string;
  section_id?: number | string;
  site_id?: number | string;
  position_id?: number | string;
  grade_id?: number | string;
  salary_grade_id?: number | string;
  salary_grade_jenjang_id?: number | string;
  pangkat?: string;
  work_area?: string;
  employment_status?: string;
  employment_type_id?: number | string;
  gender?: string;
  page?: number;
  per_page?: number;
}
