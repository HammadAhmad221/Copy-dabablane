export interface ReservationType {
  id: string;
  NUM_RES?: string;
  blane_id: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  notes?: string;
  status: string;
  created_at: string;
  updated_at?: string;
} 