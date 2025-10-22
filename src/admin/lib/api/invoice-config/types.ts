export interface InvoiceConfigurationData {
  id?: number;
  billing_email: string;
  contact_email: string;
  contact_phone: string;
  invoice_legal_mentions: string;
  invoice_prefix: string;
  invoice_logo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GetInvoiceConfigResponse {
  data: InvoiceConfigurationData | null;
  message: string;
  status: number;
}

export interface CreateInvoiceConfigRequest {
  billing_email: string;
  contact_email: string;
  contact_phone: string;
  invoice_legal_mentions: string;
  invoice_prefix: string;
  invoice_logo_path?: File | Blob | null;
}

export interface CreateInvoiceConfigResponse {
  data: InvoiceConfigurationData;
  message: string;
  status: number;
}
