export interface ReservationType {
  id: number;
  customers_id: number;
  blane_id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  date: string;
  quantity:number;
  time: string;
  comments: string;
  status: "pending" | "confirmed" | "canceled" | "cancelled" | "paid";
  created_at: string;
  updated_at: string;
}

export interface ReservationsResponse {
  data: ReservationType[];
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

export interface ReservationFormData {
  blane_id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  date: string;
  end_date: string;
  time: string;
  comments: string;
  quantity:number;
  status?: "pending" | "confirmed" | "canceled";
  total_price: number;
}

export interface ReservationFilters {
  page?: number;
  paginationSize?: number;
  sortBy?: string | null;
  sortOrder?: string | null;
  search?: string | null;
  user_id?: string | null;
  status?: string | null;
}

export interface OrderFormData {
  total_price: number;
}
