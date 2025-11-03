import { adminApiClient } from '../client';
import BACK_VENDOR_PAYMENT_ENDPOINTS from '../endpoints/vendorPayment';
import {
  VendorPayment,
  VendorPaymentFilters,
  VendorPaymentListResponse,
  MarkProcessedRequest,
  RevertPaymentRequest,
  UpdatePaymentRequest,
  PaymentLogsResponse,
  BankingReportItem,
  DashboardStats,
  WeeklySummary,
} from '../types/vendorPayment';

export const vendorPaymentApi = {
  // Get all vendor payments with filters and pagination
  getPayments: async (filters?: VendorPaymentFilters): Promise<VendorPaymentListResponse> => {
    try {
      const params = new URLSearchParams();

      if (filters?.vendor_id !== undefined && filters?.vendor_id !== null) {
        // Ensure vendor_id is a number for the API
        const vendorId = typeof filters.vendor_id === 'string' ? Number(filters.vendor_id) : filters.vendor_id;
        if (!isNaN(vendorId) && vendorId > 0) {
          params.append('vendor_id', String(vendorId));
          console.log('📤 API: Adding vendor_id filter:', vendorId);
        }
      }
      if (filters?.transfer_status) params.append('transfer_status', filters.transfer_status);
      if (filters?.payment_type) params.append('payment_type', filters.payment_type);
      if (filters?.category_id) params.append('category_id', String(filters.category_id));
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.week_start) params.append('week_start', filters.week_start);
      if (filters?.week_end) params.append('week_end', filters.week_end);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.sort_by) params.append('sort_by', filters.sort_by);
      if (filters?.sort_order) params.append('sort_order', filters.sort_order);
      if (filters?.paginationSize) params.append('paginationSize', String(filters.paginationSize));

      console.log('Fetching payments with filters:', `${BACK_VENDOR_PAYMENT_ENDPOINTS.getAllPayments()}?${params.toString()}`);
      
      const response = await adminApiClient.get(
        `${BACK_VENDOR_PAYMENT_ENDPOINTS.getAllPayments()}?${params.toString()}`
      );

      console.log('Payments raw response:', response.data);
      console.log('Payments raw response structure:', JSON.stringify(response.data, null, 2));
      console.log('Response data type:', typeof response.data);
      console.log('Is array?', Array.isArray(response.data));
      
      // Handle response structure
      let paymentsData = [];
      let metaData = {
        total: 0,
        current_page: 1,
        last_page: 1,
        per_page: filters?.paginationSize || 10,
        from: 0,
        to: 0,
      };

      // Try different response structures
      if (response.data) {
        // Structure 1: { data: [...], meta: {...} }
        if (response.data.data && Array.isArray(response.data.data)) {
          paymentsData = response.data.data;
          if (response.data.meta) {
            metaData = response.data.meta;
          }
        }
        // Structure 2: { payments: [...], total: X }
        else if (response.data.payments && Array.isArray(response.data.payments)) {
          paymentsData = response.data.payments;
          metaData.total = response.data.total || paymentsData.length;
          metaData.current_page = response.data.current_page || response.data.page || 1;
          metaData.last_page = response.data.last_page || response.data.totalPages || 1;
          metaData.per_page = response.data.per_page || filters?.paginationSize || 10;
        }
        // Structure 3: Direct array
        else if (Array.isArray(response.data)) {
          paymentsData = response.data;
          metaData.total = paymentsData.length;
        }
        // Structure 4: { results: [...], count: X }
        else if (response.data.results && Array.isArray(response.data.results)) {
          paymentsData = response.data.results;
          metaData.total = response.data.count || paymentsData.length;
        }
        // Structure 5: Wrapped in another object
        else if (response.data.data && typeof response.data.data === 'object') {
          // Check if data itself has payments
          if (response.data.data.payments) {
            paymentsData = response.data.data.payments;
          } else if (Array.isArray(response.data.data)) {
            paymentsData = response.data.data;
          }
        }
      }

      console.log('✅ Extracted payments data:', paymentsData);
      console.log('✅ Extracted payments count:', paymentsData.length);
      console.log('✅ Extracted meta data:', metaData);

      return {
        data: paymentsData,
        meta: metaData,
      } as VendorPaymentListResponse;
    } catch (error: any) {
      console.error('Error fetching vendor payments:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Get vendor payment by ID
  getPaymentById: async (id: string | number): Promise<VendorPayment> => {
    try {
      const response = await adminApiClient.get(
        BACK_VENDOR_PAYMENT_ENDPOINTS.getPaymentById(id)
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching payment by ID:', error);
      throw error;
    }
  },

  // Mark payments as processed (bulk)
  markProcessed: async (data: MarkProcessedRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await adminApiClient.put(
        BACK_VENDOR_PAYMENT_ENDPOINTS.markProcessed(),
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error marking payments as processed:', error);
      throw error;
    }
  },

  // Revert payment to pending
  revertPayment: async (id: string | number, data: RevertPaymentRequest): Promise<VendorPayment> => {
    try {
      const response = await adminApiClient.put(
        BACK_VENDOR_PAYMENT_ENDPOINTS.revertPayment(id),
        data
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error reverting payment:', error);
      throw error;
    }
  },

  // Update payment (date correction)
  updatePayment: async (id: string | number, data: UpdatePaymentRequest): Promise<VendorPayment> => {
    try {
      const response = await adminApiClient.put(
        BACK_VENDOR_PAYMENT_ENDPOINTS.updatePayment(id),
        data
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  // Export to Excel
  exportExcel: async (filters?: VendorPaymentFilters): Promise<Blob> => {
    try {
      const params = new URLSearchParams();
      if (filters?.vendor_id) params.append('vendor_id', String(filters.vendor_id));
      if (filters?.transfer_status) params.append('transfer_status', filters.transfer_status);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);

      const response = await adminApiClient.get(
        `${BACK_VENDOR_PAYMENT_ENDPOINTS.exportExcel()}?${params.toString()}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  },

  // Export to PDF
  exportPDF: async (filters?: VendorPaymentFilters): Promise<Blob> => {
    try {
      const params = new URLSearchParams();
      if (filters?.vendor_id) params.append('vendor_id', String(filters.vendor_id));
      if (filters?.transfer_status) params.append('transfer_status', filters.transfer_status);

      const response = await adminApiClient.get(
        `${BACK_VENDOR_PAYMENT_ENDPOINTS.exportPDF()}?${params.toString()}`,
        { responseType: 'blob' }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  },

  // Generate banking report
  getBankingReport: async (weekStart: string, weekEnd: string): Promise<BankingReportItem[]> => {
    try {
      const params = new URLSearchParams();
      params.append('week_start', weekStart);
      params.append('week_end', weekEnd);

      console.log('Banking report API call:', `${BACK_VENDOR_PAYMENT_ENDPOINTS.bankingReport()}?${params.toString()}`);
      
      const response = await adminApiClient.get(
        `${BACK_VENDOR_PAYMENT_ENDPOINTS.bankingReport()}?${params.toString()}`
      );
      
      console.log('Banking report raw response:', response.data);
      
      // Handle different response structures
      let data = response.data?.data || response.data;
      
      // If it's wrapped in another object, try to extract
      if (!Array.isArray(data) && data?.vendors) {
        data = data.vendors;
      }
      
      // Ensure we return an array
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('Error generating banking report:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Get audit logs
  getLogs: async (vendorPaymentId?: number, paginationSize = 10): Promise<PaymentLogsResponse> => {
    try {
      const params = new URLSearchParams();
      if (vendorPaymentId) params.append('vendor_payment_id', String(vendorPaymentId));
      params.append('paginationSize', String(paginationSize));

      console.log('Fetching logs with params:', params.toString());
      
      const response = await adminApiClient.get(
        `${BACK_VENDOR_PAYMENT_ENDPOINTS.getLogs()}?${params.toString()}`
      );

      console.log('Logs raw response:', response.data);

      if (response.data && response.data.meta) {
        return {
          data: response.data.data || [],
          meta: response.data.meta,
        };
      }

      // Handle different response structures
      let logsData = response.data?.data || response.data;
      
      // If it's wrapped in another object
      if (!Array.isArray(logsData) && logsData?.logs) {
        logsData = logsData.logs;
      }
      
      // Ensure array
      logsData = Array.isArray(logsData) ? logsData : [];

      return {
        data: logsData,
        meta: {
          total: response.data?.total || logsData.length || 0,
          current_page: response.data?.current_page || 1,
          last_page: response.data?.last_page || 1,
          per_page: response.data?.per_page || paginationSize,
        },
      };
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      console.error('Error details:', error.response?.data);
      throw error;
    }
  },

  // Get dashboard stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await adminApiClient.get(
        BACK_VENDOR_PAYMENT_ENDPOINTS.dashboard()
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  },

  // Get weekly summary
  getWeeklySummary: async (weekStart?: string): Promise<WeeklySummary> => {
    try {
      const params = new URLSearchParams();
      if (weekStart) params.append('week_start', weekStart);

      const response = await adminApiClient.get(
        `${BACK_VENDOR_PAYMENT_ENDPOINTS.weeklySummary()}?${params.toString()}`
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      throw error;
    }
  },
};

export default vendorPaymentApi;
