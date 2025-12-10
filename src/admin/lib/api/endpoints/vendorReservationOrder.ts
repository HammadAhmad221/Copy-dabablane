import { adminApiClient } from '../client';
import {
  VendorReservationOrderFilters,
  VendorReservationOrderResponse,
} from '../types/vendorReservationOrder';

export const vendorReservationOrderEndpoints = {
  getVendorReservationsAndOrders: (
    filters?: VendorReservationOrderFilters,
    limit = 100,
    page = 1
  ): Promise<{ data: VendorReservationOrderResponse }> => {
    const params = new URLSearchParams();

    params.append('paginationSize', limit.toString());
    params.append('page', page.toString());
    params.append('include', 'blaneImage,customer');

    if (filters?.commerce_name) {
      params.append('commerce_name', filters.commerce_name);
    }

    if (filters?.time_period) {
      // Map time periods to API parameters
      if (filters.time_period === 'past') {
        params.append('include_expired', '1');
        params.append('time_filter', 'past');
      } else if (filters.time_period === 'present') {
        params.append('include_expired', '0');
        params.append('time_filter', 'current');
      } else if (filters.time_period === 'future') {
        params.append('include_expired', '0');
        params.append('time_filter', 'future');
      }
    } else {
      // Default: include all
      params.append('include_expired', '1');
    }

    if (filters?.status) {
      params.append('status', filters.status);
    }

    if (filters?.type && filters.type !== 'all') {
      params.append('type', filters.type);
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    const url = `/back/v1/getVendorReservationsAndOrders?${params.toString()}`;
    console.log('🔍 API Request URL:', url);
    console.log('📋 Request Parameters:', Object.fromEntries(params.entries()));

    return adminApiClient.get(url);
  },
};

