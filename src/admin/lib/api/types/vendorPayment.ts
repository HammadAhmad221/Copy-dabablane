export interface VendorPayment {
  id: number;
  vendor_id: number;
  vendor_name: string;
  vendor_company: string;
  category_id?: number;
  category_name?: string;
  booking_date: string;
  payment_date: string | null;
  transfer_date: string | null;
  total_bookings: number;
  total_amount: number;
  commission_amount: number;
  commission_vat: number;
  net_amount: number;
  payment_type: 'full' | 'partial';
  transfer_status: 'pending' | 'processed' | 'complete';
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorPaymentFilters {
  vendor_id?: number | string;
  transfer_status?: 'pending' | 'processed' | 'complete';
  payment_type?: 'full' | 'partial';
  category_id?: number | string;
  start_date?: string;
  end_date?: string;
  week_start?: string;
  week_end?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  paginationSize?: number;
}

export interface VendorPaymentListResponse {
  data: VendorPayment[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    from: number;
    to: number;
  };
}

export interface MarkProcessedRequest {
  payment_ids: number[];
  transfer_date: string;
  note?: string;
}

export interface RevertPaymentRequest {
  note?: string;
}

export interface UpdatePaymentRequest {
  booking_date?: string;
  payment_date?: string;
  transfer_date?: string;
  note?: string;
}

export interface PaymentLog {
  id: number;
  vendor_payment_id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  note?: string;
  ip_address?: string;
  created_at: string;
}

export interface PaymentLogsResponse {
  data: PaymentLog[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
  };
}

export interface BankingReportItem {
  vendor_id: number;
  vendor_name: string;
  vendor_company: string;
  bank_name?: string;
  rib?: string;
  total_amount: number;
  payments_count: number;
}

export interface DashboardStats {
  pending_payments: {
    count: number;
    total_amount: number;
  };
  processed_this_week: {
    count: number;
    total_amount: number;
  };
  total_vendors: number;
  average_payment: number;
}

export interface WeeklySummary {
  week_start: string;
  week_end: string;
  total_payments: number;
  total_amount: number;
  pending_count: number;
  processed_count: number;
  vendors_count: number;
}
