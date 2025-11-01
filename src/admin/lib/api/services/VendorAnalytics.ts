import { adminApiClient as apiClient } from '../client';
import BACK_VENDOR_ANALYTICS_ENDPOINTS from '../endpoints/VendorAnalytics';

export interface VendorAnalyticsResponse {
  name: string;
  value: number | string;
  change: number;
  icon: string;
  details?: {
    near_expiration?: number;
    percentage_active?: number;
    percentage_inactive?: number;
    percentage_expired?: number;
    percentage_near_expiration?: number;
    days_threshold?: number;
  };
}

export interface VendorAnalyticsParams {
  company_name: string;
  period?: string;
  start_date?: string;
  end_date?: string;
}

export const getVendorAnalytics = async (params: VendorAnalyticsParams): Promise<VendorAnalyticsResponse[]> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('company_name', params.company_name);
    if (params.period) {
      queryParams.append('period', params.period);
    }
    if (params.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params.end_date) {
      queryParams.append('end_date', params.end_date);
    }

    const url = `${BACK_VENDOR_ANALYTICS_ENDPOINTS.getVendorAnalytics()}?${queryParams.toString()}`;
    console.log('Fetching vendor analytics from:', url);
    
    const response = await apiClient.get(url);
    console.log('Vendor Analytics Raw Response:', response.data);
    
    // Handle different response structures
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data?.analytics && Array.isArray(response.data.analytics)) {
      return response.data.analytics;
    }
    
    // Log unexpected response structure
    console.warn('Unexpected vendor analytics response structure:', response.data);
    return [];
  } catch (error: any) {
    console.error('Vendor Analytics API Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Export the service as an object
export const vendorAnalyticsService = {
  getVendorAnalytics,
};

