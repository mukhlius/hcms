export type DocumentCategory = 'REGULATION' | 'POLICY_SOP' | 'INTERNAL_MEMO' | 'FORM_TEMPLATE';
export type AudienceType = 'ALL' | 'DEPARTMENT' | 'SECTION' | 'POSITION';
export type DocumentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface CompanyDocumentTarget {
  id?: number;
  company_document_id?: number;
  target_type: AudienceType;
  target_id: number;
  target_name?: string;
}

export interface CompanyDocumentItem {
  id: number;
  document_number: string;
  title: string;
  category: DocumentCategory;
  description?: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  formatted_file_size?: string;
  mime_type: string;
  version: string;
  effective_date: string;
  expiry_date?: string | null;
  is_acknowledgment_required: boolean;
  audience_type: AudienceType;
  status: DocumentStatus;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  targets?: CompanyDocumentTarget[];
  reads_count?: number;
  is_read?: boolean;
  read_at?: string | null;
  acknowledged_at?: string | null;
  creator?: {
    id: number;
    name: string;
    username: string;
  };
}

export interface DocumentCategoryCount {
  ALL: number;
  REGULATION: number;
  POLICY_SOP: number;
  INTERNAL_MEMO: number;
  FORM_TEMPLATE: number;
}
