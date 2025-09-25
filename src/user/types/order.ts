export interface OrderType {
  id: string;
  NUM_ORD?: string;
  blane_id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  quantity: number;
  total_amount: number;
  payment_method: 'cash' | 'card';
  status: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
} 