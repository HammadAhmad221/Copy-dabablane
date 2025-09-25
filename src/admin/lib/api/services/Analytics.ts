import { adminApiClient as apiClient } from '../client';
import BACK_ANALYTICS_ENDPOINTS from '../endpoints/Analytics';

export interface AnalyticsResponse {
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

export interface BlanesStatusResponse {
  active: number;
  inactive: number;
  expired: number;
  total: number;
  last_updated: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  icon_url?: string;
  image_url?: string;
  slug?: string;
}

export interface NearExpirationResponse {
  count: number;
  blanes: Array<{
    id: number;
    category: Category;
    merchant: any;
    expiration_date: string;
  }>;
  threshold_date: string;
}

export interface StatusDistributionResponse {
  distribution: {
    active: { count: number; percentage: number };
    inactive: { count: number; percentage: number };
    expired: { count: number; percentage: number };
  };
  total: number;
}

export interface SalesStatsResponse {
  daily_sales: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  top_selling_blanes: Array<any>;
  total_revenue: number;
  average_order_value: number;
}

export interface UserStatsResponse {
  new_users: number;
  active_users: number;
  users_by_role: Array<{
    name: string;
    count: number;
  }>;
  total_users: number;
}

export interface ReservationStatsResponse {
  by_status: Array<{
    status: string;
    count: number;
  }>;
  daily_trend: Array<{
    date: string;
    count: number;
  }>;
  total_reservations: number;
  recent_reservations: Array<any>;
}

export interface PerformanceMetricsResponse {
  order_conversion_rate: number;
  average_reservation_value: number;
  top_categories: Array<{
    name: string;
    count: number;
  }>;
  performance_indicators: {
    blane_utilization: number;
    customer_satisfaction: number;
    revenue_growth: number;
  };
}

export const getAnalytics = async (): Promise<AnalyticsResponse[]> => {
  try {
    const response = await apiClient.get(BACK_ANALYTICS_ENDPOINTS.getAllAnalytics());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBlanesStatus = async (): Promise<BlanesStatusResponse> => {
  try {
    const response = await apiClient.get(BACK_ANALYTICS_ENDPOINTS.getBlanesStatus());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNearExpiration = async (): Promise<NearExpirationResponse> => {
  try {
    const response = await apiClient.get(BACK_ANALYTICS_ENDPOINTS.getNearExpiration());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStatusDistribution = async (): Promise<StatusDistributionResponse> => {
  try {
    const response = await apiClient.get(BACK_ANALYTICS_ENDPOINTS.getStatusDistribution());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSalesStats = async (): Promise<SalesStatsResponse> => {
  try {
    const response = await apiClient.get(BACK_ANALYTICS_ENDPOINTS.getSalesStats());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserStats = async (): Promise<UserStatsResponse> => {
  try {
    const response = await apiClient.get(BACK_ANALYTICS_ENDPOINTS.getUserStats());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getReservationStats = async (): Promise<ReservationStatsResponse> => {
  try {
    const response = await apiClient.get(BACK_ANALYTICS_ENDPOINTS.getReservationStats());
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPerformanceMetrics = async (): Promise<PerformanceMetricsResponse> => {
  try {
    const response = await apiClient.get(BACK_ANALYTICS_ENDPOINTS.getPerformanceMetrics());
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Export the service as an object to match the import in useExpirationAlerts.ts
export const analyticsService = {
  getAnalytics,
  getBlanesStatus,
  getNearExpiration,
  getStatusDistribution,
  getSalesStats,
  getUserStats,
  getReservationStats,
  getPerformanceMetrics
};

