export type EmployeeBank = {
  id: number;
  employee_id: number;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type EmployeeBankDraft = {
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  is_primary: boolean;
};

export type EmployeeEmergencyContact = {
  id: number;
  employee_id: number;
  contact_name: string;
  relationship: string;
  phone: string;
  created_at: string;
  updated_at: string;
};

export type EmployeeEmergencyContactDraft = {
  contact_name: string;
  relationship: string;
  phone: string;
};

export type DegreeLevel = 'Diploma' | 'Bachelor' | 'Master' | 'Doctorate' | 'Other';

export type EmployeeEducation = {
  id: number;
  employee_id: number;
  degree_level: DegreeLevel | string;
  field_of_study: string | null;
  institution_name: string | null;
  passing_year: number | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeEducationDraft = {
  degree_level: DegreeLevel | '';
  field_of_study: string;
  institution_name: string;
  passing_year: number | '';
};

export type EmployeeLeaveAllocation = {
  id: number;
  employee_id: number;
  fiscal_year_id: number;
  leave_type_id: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
  fiscal_year?: { id: number; name: string; is_active: boolean } | null;
  leave_type?: {
    id: number;
    name: string;
    code: string | null;
    is_paid: boolean;
  } | null;
  created_at: string;
  updated_at: string;
};

export type AttachmentCategory = 'cv' | 'contract' | 'id_document' | 'other';

export type EmployeeAttachment = {
  id: number;
  employee_id: number;
  category: AttachmentCategory | string;
  title: string | null;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  is_employee_visible: boolean;
  uploaded_by: number | null;
  uploader?: { id: number; name: string; email: string } | null;
  created_at: string;
  updated_at: string;
};

export type EmployeeAttachmentDownload = {
  download_url: string;
  expires_at: string;
  original_name: string;
};
