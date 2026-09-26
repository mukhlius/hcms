import { Employee, EmployeeFamily, EmployeeEducation, EmployeeEmergencyContact, EmployeeHealthSafety, EmployeeBankAccount } from './employee';
import { User } from './index';

export type ReregistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProposedData {
  nickname?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  gender?: 'MALE' | 'FEMALE';
  religion?: string | null;
  marital_status?: string | null;
  marriage_date?: string | null;
  id_card_number?: string | null;
  tax_number?: string | null;
  tax_status?: string | null;
  bpjs_ketenagakerjaan?: string | null;
  bpjs_kesehatan?: string | null;
  insurance_admedika?: string | null;
  email_personal?: string | null;
  phone_mobile?: string | null;
  phone_home?: string | null;
  ktp_address?: string | null;
  ktp_city?: string | null;
  ktp_district?: string | null;
  ktp_village?: string | null;
  ktp_province?: string | null;
  ktp_postal_code?: string | null;
  residential_address?: string | null;
  residential_city?: string | null;
  residential_district?: string | null;
  residential_village?: string | null;
  residential_province?: string | null;
  residential_postal_code?: string | null;
  mailing_address?: string | null;
  mailing_city?: string | null;
  mailing_district?: string | null;
  mailing_village?: string | null;
  mailing_province?: string | null;
  mailing_postal_code?: string | null;
  
  families?: EmployeeFamily[];
  educations?: EmployeeEducation[];
  emergency_contacts?: EmployeeEmergencyContact[];
  health_safety?: EmployeeHealthSafety;
  bank_accounts?: EmployeeBankAccount[];
}

export interface DifferenceItem {
  field: string;
  label: string;
  old_value: any;
  new_value: any;
}

export interface DifferenceSummary {
  scalar_changes: DifferenceItem[];
  families_count_old: number;
  families_count_new: number;
  educations_count_old: number;
  educations_count_new: number;
  emergency_contacts_count_old: number;
  emergency_contacts_count_new: number;
  bank_accounts_count_old: number;
  bank_accounts_count_new: number;
  has_health_safety_change: boolean;
}

export interface EmployeeReregistration {
  id: number;
  ticket_number: string;
  employee_id: number;
  submitted_by_user_id: number;
  status: ReregistrationStatus;
  submission_notes?: string | null;
  original_data: any;
  proposed_data: ProposedData;
  review_notes?: string | null;
  reviewed_by_user_id?: number | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  employee?: Employee;
  submitter?: User;
  reviewer?: User;
}

export interface ReregistrationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
