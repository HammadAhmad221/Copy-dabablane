/**
 * Order related type definitions
 */

/**
 * Interface for order data submission
 */
export interface OrderFormData {
  blane_id: number;
  name: string;
  email: string;
  phone: string;
  delivery_address?: string;
  city?: string;
  quantity: number;
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
 * Interface for order details from the API
 */
export interface OrderType {
  id: number;
  order_number: string;
  NUM_ORD?: string;
  blane_id: number;
  customer_id: number;
  quantity: number;
  total_price: number;
  status: 'pending' | 'paid' | 'processing' | 'delivered' | 'canceled';
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  shipping_address?: string;
  shipping_city?: string;
  shipping_status?: string;
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
 * Interface for orders list response from the API
 */
export interface OrdersResponse {
  data: OrderType[];
  meta?: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
  };
} 