import { vendorReservationOrderEndpoints } from '../endpoints/vendorReservationOrder';
import {
  VendorReservationOrderFilters,
  VendorReservationOrderResponse,
  ReservationOrderItem,
} from '../types/vendorReservationOrder';

export const vendorReservationOrderApi = {
  /**
   * Get vendor reservations and orders with filters
   */
  getVendorReservationsAndOrders: async (
    filters?: VendorReservationOrderFilters,
    limit = 100,
    page = 1
  ): Promise<VendorReservationOrderResponse> => {
    try {
      console.log('📋 Fetching vendor reservations and orders with filters:', {
        filters,
        limit,
        page,
      });

      const response = await vendorReservationOrderEndpoints.getVendorReservationsAndOrders(
        filters,
        limit,
        page
      );

      console.log('✅ Vendor reservations and orders fetched successfully:', response.data);

      // The API returns data in the following structure:
      // {
      //   total_reservations, total_orders, total_revenue,
      //   past_reservations, current_reservations, future_reservations,
      //   past_orders, current_orders, future_orders
      // }
      return response.data;
    } catch (error: any) {
      console.error('❌ Error fetching vendor reservations and orders:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch vendor reservations and orders'
      );
    }
  },

  /**
   * Get reservations and orders for a specific vendor by commerce name
   */
  getByVendorCommerceName: async (
    commerceName: string,
    timePeriod?: 'past' | 'present' | 'future',
    limit = 100,
    page = 1
  ): Promise<VendorReservationOrderResponse> => {
    const filters: VendorReservationOrderFilters = {
      commerce_name: commerceName,
      time_period: timePeriod,
    };

    return vendorReservationOrderApi.getVendorReservationsAndOrders(filters, limit, page);
  },
};

