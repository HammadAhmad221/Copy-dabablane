export interface Coupon {
  id: number;
  code: string;
  discount: number;
  validity: string;
  minPurchase?: number;
  max_usage?: number;
  description?: string;
  categories_id: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CouponFormData {
  code: string;
  discount: number;
  validity: string;
  minPurchase?: number;
  max_usage?: number;
  description?: string;
  is_active: boolean;
  categories_id: number;
}

export interface CouponResponse {
  data: Coupon[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface CouponFilters {
  page?: number;
  paginationSize?: number;
  sortBy?: 'created_at' | 'code' | 'discount';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  is_active?: boolean;
  category?: string;
  subCategory?: string;
}