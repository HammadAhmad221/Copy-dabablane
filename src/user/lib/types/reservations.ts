/**
 * Reservation type definitions
 */

/**
 * Interface for reservation form data
 */
export interface ReservationFormData {
  blane_id: number;
  name: string;
  email: string;
  phone: string;
  date: string;
  time_slot: string;
  number_of_people: number;
  comments?: string;
  payment_method: 'cash' | 'online' | 'partiel';
  total_price: number;
  partiel_price?: number;
}

/**
 * Interface for cancellation data
 */
export interface CancellationData {
  id: string;
  token: string;
  timestamp: string;
}

/**
 * Interface for reservation details from the API
 */
export interface ReservationType {
  id: number;
  reservation_number: string;
  NUM_RES?: string;
  blane_id: number;
  customer_id: number;
  date: string;
  time_slot: string;
  number_of_people: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'canceled' | 'completed';
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  comments?: string;
  created_at: string;
  updated_at: string;
  blane?: {
    id: number;
    name: string;
    price_current: number;
    is_digital?: boolean;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  payment_info?: {
    payment_url: string;
    method: string;
    inputs: Record<string, string | number>;
  };
  cancellation_data?: CancellationData;
}

/**
 * Interface for reservations list response from the API
 */
export interface ReservationsResponse {
  data: ReservationType[];
  meta?: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
  };
} 