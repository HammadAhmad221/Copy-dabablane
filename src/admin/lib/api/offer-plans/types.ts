export interface VendorPlan {
  id: number;
  title: string;
  slug: string;
  price_ht: number | string; // API returns string, but we normalize to number
  original_price_ht: number | string; // API returns string, but we normalize to number
  duration_days: number;
  description: string;
  is_recommended: boolean;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVendorPlanRequest {
  title: string;
  slug: string;
  price_ht: number;
  original_price_ht: number;
  duration_days: number;
  description: string;
  is_recommended: boolean;
  display_order: number;
  is_active: boolean;
}

export interface UpdateVendorPlanRequest extends CreateVendorPlanRequest {}

export interface VendorPlanResponse {
  data: VendorPlan;
  message: string;
  status: number;
}

export interface VendorPlansListResponse {
  data: VendorPlan[];
  message: string;
  status: number;
}