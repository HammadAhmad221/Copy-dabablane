import { adminApiClient as apiClient } from '../client';
import BACK_ORDERS_ENDPOINTS from '../endpoints/orders';
import { OrderType, OrdersResponse, OrderFormData, OrderFilters } from '../types/orders';
import { ApiResponse } from '../types/api';

export const orderApi = {
  // Get all orders with pagination and filters
  getOrders: async (filters: OrderFilters = {}): Promise<OrdersResponse> => {
    try {
      const { page, paginationSize, sortBy, sortOrder, search } = filters;
      const params: Record<string, any> = {
        page,
        per_page: paginationSize,
      };

      if (sortBy) params.sort_by = sortBy;
      if (sortOrder) params.sort_order = sortOrder;
      if (search) params.search = search;

      const response = await apiClient.get<OrdersResponse>(
        BACK_ORDERS_ENDPOINTS.getAllOrders(),
        { params }
      );

      if (!response.data || !response.data.data || !response.data.meta) {
        throw new Error('Invalid API response structure');
      }

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch orders: ${error?.message || 'Unknown error'}`);
    }
  },

  // Get a single order by ID
  getOrder: async (id: string): Promise<OrderType> => {
    try {
      const response = await apiClient.get<ApiResponse<OrderType>>(
        BACK_ORDERS_ENDPOINTS.getOrderById(id)
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new order
  createOrder: async (data: OrderFormData): Promise<OrderType> => {
    try {
      console.log('📤 Order API - Create request:', {
        endpoint: BACK_ORDERS_ENDPOINTS.createOrder(),
        payload: data,
        payloadTypes: Object.keys(data).reduce((acc, key) => {
          acc[key] = typeof (data as any)[key];
          return acc;
        }, {} as Record<string, string>)
      });
      
      const response = await apiClient.post<ApiResponse<OrderType>>(
        BACK_ORDERS_ENDPOINTS.createOrder(),
        data
      );
      
      console.log('✅ Order API - Create response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Order API - Create error:', {
        error: error,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  },

  // Update an existing order
  updateOrder: async (id: string, data: Partial<OrderFormData>): Promise<OrderType> => {
    try {
      const response = await apiClient.put<ApiResponse<OrderType>>(
        BACK_ORDERS_ENDPOINTS.updateOrder(id),
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete an order
  deleteOrder: async (id: string): Promise<void> => {
    try {
      await apiClient.delete<ApiResponse<void>>(
        BACK_ORDERS_ENDPOINTS.deleteOrder(id)
      );
    } catch (error) {
      throw error;
    }
  },
  updateOrderStatus: async (id: string, status: OrderType['status']): Promise<OrderType> => {
    try {
      const response = await apiClient.patch<ApiResponse<OrderType>>(
        BACK_ORDERS_ENDPOINTS.updateOrderStatus(id),
        { status }
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }
};