import { z } from 'zod';

export type CommissionStatus = 'active' | 'inactive';

export interface Commission {
  id: number;
  category_id?: number;
  vendor_id?: number;
  commission_rate: number;
  partial_commission_rate?: number;
  is_active: boolean;
  category_name?: string;
  vendor_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCommissionRequest {
  category_id?: number | null;
  vendor_id?: number | null;
  commission_rate: number;
  partial_commission_rate?: number;
  is_active?: boolean;
}

export interface UpdateCommissionRequest {
  commission_rate?: number;
  partial_commission_rate?: number;
  is_active?: boolean;
}

export interface VendorCommissionRate {
  id: number;
  vendor_id: number;
  custom_commission_rate?: number;
  partial_commission_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateVendorRateRequest {
  custom_commission_rate?: number;
  partial_commission_rate?: number;
}

export interface GlobalCommissionSettings {
  id: number;
  partial_payment_commission_rate: number;
  vat_rate: number;
  daba_blane_account_iban: string;
  transfer_processing_day: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateGlobalSettingsRequest {
  partial_payment_commission_rate?: number;
  vat_rate?: number;
  daba_blane_account_iban?: string;
  transfer_processing_day?: string;
}

export interface CommissionListResponse {
  data: Commission[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    from?: number;
    to?: number;
  };
}

export interface CommissionFilters {
  category_id?: number | null;
  vendor_id?: number | null;
  status?: CommissionStatus | null;
  search?: string | null;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc' | null;
  page?: number;
  paginationSize?: number;
}

export interface CommissionFormData {
  category_id: number;
  vendor_id?: number | null;
  rate: number;
  status: CommissionStatus;
}

export interface CommissionResponse {
  data: CommissionRate[];
  links: Links;
  meta: Meta;
}

export interface Links {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  links: MetaLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface MetaLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface CommissionSettings {
  partial_payment_percentage: number;
  vat_rate: number;
  daba_blane_iban: string;
  transfer_processing_day: number;
}

export interface CommissionSettingsFormData {
  partial_payment_percentage: number;
  vat_rate: number;
  daba_blane_iban: string;
  transfer_processing_day: number;
}

// Validation schemas
export const CommissionRateSchema = z.object({
  category_id: z.number().min(1, 'Category is required'),
  vendor_id: z.number().optional().nullable(),
  rate: z.number().min(0, 'Rate must be 0 or greater').max(100, 'Rate cannot exceed 100%'),
  status: z.enum(['active', 'inactive']),
});

export const CommissionSettingsSchema = z.object({
  partial_payment_percentage: z.number().min(0).max(100),
  vat_rate: z.number().min(0).max(100),
  daba_blane_iban: z.string().min(1, 'IBAN is required'),
  transfer_processing_day: z.number().min(1).max(31),
});

export const CommissionFiltersSchema = z.object({
  category_id: z.number().optional().nullable(),
  vendor_id: z.number().optional().nullable(),
  status: z.enum(['active', 'inactive']).optional().nullable(),
  search: z.string().optional().nullable(),
  sortBy: z.string().optional().nullable(),
  sortOrder: z.enum(['asc', 'desc']).optional().nullable(),
  page: z.number().optional(),
  paginationSize: z.number().optional(),
});

