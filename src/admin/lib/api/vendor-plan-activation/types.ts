export interface VendorListItem {
  id: number;
  name: string;
  email?: string;
}

export interface VendorsListResponse {
  data: VendorListItem[];
  message: string;
  status: number;
}

export interface VendorSubscriptionItem {
  id: number;
  user_id: number;
  plan_id: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface VendorsSubscriptionListResponse {
  data: VendorSubscriptionItem[];
  message: string;
  status: number;
}

export interface ManualPurchaseAddOn {
  id: number;
  quantity: number;
}

export interface ManualPurchaseRequest {
  user_id: number;
  plan_id: number;
  add_ons: ManualPurchaseAddOn[];
  promo_code?: string | null;
}

export interface ManualPurchaseResponse {
  data: any;
  message: string;
  status: number;
}

export interface ActivatePurchaseRequest {
  plan_id: number;
  add_ons: ManualPurchaseAddOn[];
  promo_code?: string | null;
  payment_method: 'online' | 'cash' | 'card' | string;
}

export interface ActivatePurchaseResponse {
  data: any;
  message: string;
  status: number;
}
