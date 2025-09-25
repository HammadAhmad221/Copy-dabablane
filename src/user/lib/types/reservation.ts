/**
 * Reservation related type definitions
 */

/**
 * Interface for time slot data
 */
export interface TimeSlot {
  time: string;
  available: boolean;
  currentReservations: number;
  maxReservations: number;
}

/**
 * Interface for reservation data submission
 */
export interface ReservationData {
  blane_id: number;
  date: string;
  time?: string;
  period_id?: string;
  name: string;
  email: string;
  phone: string;
  number_persons: number;
  comments?: string;
  quantity: number;
  payment_method?: string;
  total_price?: number;
  partiel_price?: number;
  end_date?: string;
  city?: string;
}

/**
 * Interface for reservation response from the API
 */
export interface ReservationResponse {
  id: number;
  blane_id: number;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  quantity: number;
  number_persons: number;
  comments?: string;
  status: "pending" | "confirmed" | "canceled";
  created_at: string;
  updated_at: string;
  total_price?: number;
  reservation_number?: string;
  payment_method?: string;
  NUM_RES?: string;
  payment_info?: {
    payment_url: string;
    method: string;
    inputs: Record<string, string | number>;
  };
  cancellation_data?: {
    id: string;
    token: string;
    timestamp: string;
  };
  customer?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
} 