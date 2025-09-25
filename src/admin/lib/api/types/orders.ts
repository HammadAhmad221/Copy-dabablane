export interface OrderType {
  id: number;
  customers_id: number;
  blane_id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  quantity: number;
  delivery_address: string;
  total_price: number;
  status: "pending" | "confirmed" | "shipped" | "cancelled";
  created_at: string;
  updated_at: string;
  comments?: string;
}

export interface OrdersResponse {
  data: OrderType[];
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

export interface OrderFormData {
  blane_id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  quantity: number;
  delivery_address: string;
  status: "pending" | "confirmed" | "shipped" | "cancelled";
  comments: string;
}

export interface OrderFilters {
  page?: number;
  paginationSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}