export interface TermsAndCondition {
  id: number;
  title: string;
  description?: string;
  version: string;
  is_active: boolean;
  pdf_file: string; // URL to the PDF file
  pdf_file_name?: string;
  pdf_file_size?: number;
  created_at: string;
  updated_at: string;
}

export interface TermsAndConditionResponse {
  data: TermsAndCondition;
}

export interface UploadTermsAndConditionRequest {
  title: string;
  description?: string;
  version: string;
  is_active: boolean | number | string;
  pdf_file: File;
}

export interface TermsAndConditionFormData {
  title: string;
  description: string;
  version: string;
  is_active: boolean;
  pdf_file: File | null;
}

