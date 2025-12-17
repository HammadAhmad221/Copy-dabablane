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

      const url = `${BACK_VENDOR_PAYMENT_ENDPOINTS.getAllPayments()}?${params.toString()}`;
      console.log('📤 Fetching payments from:', url);
      
      const response = await adminApiClient.get(url);

      console.log('✅ Payments raw response received');
      console.log('📦 Response data:', response.data);
      console.log('📦 Response data type:', typeof response.data);
      console.log('📦 Is array?', Array.isArray(response.data));
      console.log('📦 Response keys:', response.data ? Object.keys(response.data) : 'null');
      
      // Log the full structure for debugging
      if (response.data) {
        console.log('📦 Full response structure:', JSON.stringify(response.data, null, 2));
      }
      
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
        console.log('🔍 Analyzing response structure...');
        
        // Structure 1: { data: [...], meta: {...} } - Laravel standard
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log('✅ Structure 1: Laravel standard { data: [...], meta: {...} }');
          paymentsData = response.data.data;
          if (response.data.meta) {
            metaData = response.data.meta;
          } else {
            metaData.total = paymentsData.length;
          }
        }
        // Structure 2: Direct array
        else if (Array.isArray(response.data)) {
          console.log('✅ Structure 2: Direct array');
          paymentsData = response.data;
          metaData.total = paymentsData.length;
        }
        // Structure 3: { payments: [...], total: X }
        else if (response.data.payments && Array.isArray(response.data.payments)) {
          console.log('✅ Structure 3: { payments: [...], total: X }');
          paymentsData = response.data.payments;
          metaData.total = response.data.total || paymentsData.length;
          metaData.current_page = response.data.current_page || response.data.page || 1;
          metaData.last_page = response.data.last_page || response.data.totalPages || 1;
          metaData.per_page = response.data.per_page || filters?.paginationSize || 10;
        }
        // Structure 4: { results: [...], count: X }
        else if (response.data.results && Array.isArray(response.data.results)) {
          console.log('✅ Structure 4: { results: [...], count: X }');
          paymentsData = response.data.results;
          metaData.total = response.data.count || paymentsData.length;
        }
        // Structure 5: Laravel pagination without nested data
        else if (response.data.current_page !== undefined && response.data.last_page !== undefined) {
          console.log('✅ Structure 5: Laravel pagination at root level');
          // Check for data array at root
          const possibleArrayKeys = Object.keys(response.data).filter(key => 
            Array.isArray(response.data[key])
          );
          if (possibleArrayKeys.length > 0) {
            paymentsData = response.data[possibleArrayKeys[0]];
            console.log(`✅ Found array in key: ${possibleArrayKeys[0]}`);
          }
          metaData = {
            total: response.data.total || 0,
            current_page: response.data.current_page || 1,
            last_page: response.data.last_page || 1,
            per_page: response.data.per_page || filters?.paginationSize || 10,
            from: response.data.from || 0,
            to: response.data.to || 0,
          };
        }
        // Structure 6: Wrapped in another object
        else if (response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
          console.log('✅ Structure 6: Nested object');
          // Check if data itself has payments
          if (response.data.data.payments && Array.isArray(response.data.data.payments)) {
            paymentsData = response.data.data.payments;
          } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
            paymentsData = response.data.data.data;
          }
        }
        else {
          console.warn('⚠️ Unknown response structure, trying to find arrays...');
          // Last resort: find any array in the response
          const findArrays = (obj: any, path = ''): any[] => {
            if (Array.isArray(obj)) return obj;
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                const result = findArrays(obj[key], `${path}.${key}`);
                if (result.length > 0) {
                  console.log(`✅ Found array at path: ${path}.${key}`);
                  return result;
                }
              }
            }
            return [];
          };
          paymentsData = findArrays(response.data);
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
      console.log('📤 Fetching payment by ID:', id);
      // Add query parameter to include vendor details
      const url = `${BACK_VENDOR_PAYMENT_ENDPOINTS.getPaymentById(id)}?include=vendor,category`;
      console.log('📤 Request URL:', url);
      
      const response = await adminApiClient.get(url);
      
      console.log('✅ Raw API response:', response.data);
      console.log('✅ Response structure:', {
        hasData: !!response.data?.data,
        hasVendor: !!(response.data?.data?.vendor || response.data?.vendor),
        hasCategory: !!(response.data?.data?.category || response.data?.category),
      });
      
      const payment = response.data?.data || response.data;
      
      // If vendor info is missing, try to populate it from vendor_id
      if (payment && !payment.vendor_company && !payment.vendor?.company_name) {
        console.warn('⚠️ Vendor info missing in payment response');
      }
      
      return payment;
    } catch (error) {
      console.error('❌ Error fetching payment by ID:', error);
      throw error;
    }
  },

  // Mark payments as processed (bulk)
  markProcessed: async (data: MarkProcessedRequest): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('📤 Marking payments as processed:', data);
      console.log('📤 API endpoint:', BACK_VENDOR_PAYMENT_ENDPOINTS.markProcessed());
      
      const response = await adminApiClient.put(
        BACK_VENDOR_PAYMENT_ENDPOINTS.markProcessed(),
        data
      );
      
      console.log('✅ Mark processed response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error marking payments as processed:', error);
      console.error('❌ Error response:', error.response?.data);
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

  // Update payment status
  updateStatus: async (
    id: string | number,
    transfer_status: string
  ): Promise<VendorPayment | { success?: boolean; message?: string }> => {
    try {
      const response = await adminApiClient.put(
        BACK_VENDOR_PAYMENT_ENDPOINTS.updateStatus(id),
        { transfer_status }
      );
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error updating payment status:', error);
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

      const url = `${BACK_VENDOR_PAYMENT_ENDPOINTS.bankingReport()}?${params.toString()}`;
      console.log('📤 Banking report API call:', url);
      console.log('📤 Dates:', { weekStart, weekEnd });
      
      const response = await adminApiClient.get(url);
      
      console.log('✅ Banking report raw response:', response.data);
      console.log('✅ Response type:', typeof response.data);
      console.log('✅ Is array?', Array.isArray(response.data));
      
      if (response.data && typeof response.data === 'object') {
        console.log('✅ Response keys:', Object.keys(response.data));
        console.log('✅ Full response structure:', JSON.stringify(response.data, null, 2));
      }
      
      // Handle the specific response structure: { data: { payments: [...] } }
      let data = [];
      
      if (response.data?.data?.payments && Array.isArray(response.data.data.payments)) {
        console.log('✅ Found payments array in response.data.data.payments');
        data = response.data.data.payments;
      } else if (response.data?.payments && Array.isArray(response.data.payments)) {
        console.log('✅ Found payments array in response.data.payments');
        data = response.data.payments;
      } else if (Array.isArray(response.data?.data)) {
        console.log('✅ response.data.data is an array');
        data = response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('✅ response.data is an array');
        data = response.data;
      } else if (response.data?.data?.vendors && Array.isArray(response.data.data.vendors)) {
        console.log('✅ Found vendors array in response.data.data.vendors');
        data = response.data.data.vendors;
      } else if (response.data?.vendors && Array.isArray(response.data.vendors)) {
        console.log('✅ Found vendors array in response.data.vendors');
        data = response.data.vendors;
      }
      
      console.log('✅ Final extracted data:', data);
      console.log('✅ Data length:', data.length);
      
      // Log first item to see structure
      if (data.length > 0) {
        console.log('✅ First item structure:', data[0]);
        console.log('✅ First item keys:', Object.keys(data[0]));
      }
      
      // Log summary if available
      if (response.data?.data?.summary) {
        console.log('📊 Report summary:', response.data.data.summary);
      }
      
      // Transform payment records into grouped vendor summaries
      if (data.length > 0 && data[0].vendor) {
        console.log('🔄 Transforming payment records into vendor summaries...');
        const vendorMap = new Map<number, BankingReportItem>();
        
        data.forEach((payment: any) => {
          const vendorId = payment.vendor_id;
          
          if (!vendorMap.has(vendorId)) {
            vendorMap.set(vendorId, {
              vendor_id: vendorId,
              vendor_name: payment.vendor?.name || 'N/A',
              vendor_company: payment.vendor?.company_name || payment.vendor?.name || 'N/A',
              bank_name: payment.vendor?.bank_name || undefined,
              rib: payment.vendor?.rib_account || undefined,
              total_amount: 0,
              payments_count: 0,
            });
          }
          
          const vendorSummary = vendorMap.get(vendorId)!;
          vendorSummary.total_amount += parseFloat(payment.net_amount_ttc || payment.total_amount_ttc || 0);
          vendorSummary.payments_count += 1;
        });
        
        const groupedData = Array.from(vendorMap.values());
        console.log('✅ Grouped data by vendor:', groupedData);
        console.log('✅ Number of vendors:', groupedData.length);
        
        return groupedData;
      }
      
      return data;
    } catch (error: any) {
      console.error('❌ Error generating banking report:', error);
      console.error('❌ Error details:', error.response?.data);
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
