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
  reservation_id?: number;
  order_id?: number;
  type?: 'reservation' | 'order';
  status: string;
  total_amount?: number;
  total_price?: number;
  price?: number;
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customers_id?: number;
  items_count?: number;
  payment_status?: string;
  blane_image?: BlaneImage;
  commerce_name?: string;
  blane_name?: string;
  blane_id?: number;
  quantity?: number;
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

