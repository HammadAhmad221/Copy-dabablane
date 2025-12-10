export type TimePeriod = 'past' | 'present' | 'future';

export interface BlaneImage {
  id: number;
  url: string;
  media_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReservationOrderItem {
  id: number;
  vendor_id?: number;
  vendor_name?: string;
  vendor_email?: string;
  order_number?: string;
  reservation_number?: string;
  NUM_RES?: string;
  NUM_ORDER?: string;
  reservation_id?: number;
  order_id?: number;
  type?: 'reservation' | 'order';
  status: string;
  total_amount?: number;
  total_price?: number;
  price?: number;
  partiel_price?: string;
  created_at: string;
  updated_at: string;
  date?: string;
  order_date?: string;
  reservation_date?: string;
  start_date?: string;
  end_date?: string;
  time?: string | null;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  phone?: string;
  customers_id?: number;
  customer_id?: number;
  customer?: {
    id?: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  user?: {
    id?: number;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  items_count?: number;
  number_persons?: number;
  payment_status?: string;
  paymentStatus?: string;
  payment_state?: string;
  payment_method?: string;
  is_paid?: boolean | number;
  blane_image?: BlaneImage;
  blane?: {
    id?: number;
    name?: string;
    title?: string;
  };
  commerce_name?: string;
  blane_name?: string;
  blane_id?: number;
  quantity?: number;
  source?: string;
  cancel_token?: string;
  cancel_token_created_at?: string;
  comments?: string | null;
}

export interface PeriodStats {
  period: string;
  count: number;
  revenue: number;
}

export interface VendorReservationOrderFilters {
  vendor_id?: number;
  vendor_name?: string;
  commerce_name?: string;
  time_period?: TimePeriod;
  include_expired?: boolean;
  search?: string;
  status?: string;
  type?: 'reservation' | 'order' | 'all';
}

export interface VendorReservationOrderResponse {
  total_reservations: number;
  total_orders: number;
  total_revenue: number;
  period_stats?: PeriodStats[];
  past_reservations?: ReservationOrderItem[];
  current_reservations?: ReservationOrderItem[];
  future_reservations?: ReservationOrderItem[];
  past_orders?: ReservationOrderItem[];
  current_orders?: ReservationOrderItem[];
  future_orders?: ReservationOrderItem[];
  all_items?: ReservationOrderItem[];
}

