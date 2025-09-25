/**
 * Order Service for handling order-related API calls
 */
import { GuestApiClient } from '../client';
import FRONT_ORDERS_ENDPOINTS from '../endpoints/order';
import { OrderFormData, OrderType } from '../../types/orders';

// Define cancellation response interface
interface CancellationResponse {
  success: boolean;
  message: string;
}

// Define cancellation data interface that will be returned by the API
export interface CancellationData {
  id: string;
  token: string;
  timestamp: string;
}

/**
 * Order service with methods for interacting with the order API
 */
export const orderService = {
 

  /**
   * Fetches a specific order by ID
   * 
   * @param id - The ID of the order to retrieve
   * @returns Promise with the order data
   */
  async getOrder(id: string): Promise<OrderType> {
    try {
      const response = await GuestApiClient.get<{ data: OrderType }>(
        FRONT_ORDERS_ENDPOINTS.getOrderById(id), {
          params: {
            include: 'blane,blane.blaneImages,customer'
          }
        }
      );
      
      if (!response.data) {
        throw new Error('No data received');
      }
      
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching order ${id}:`, error);
      throw error;
    }
  },

  /**
   * Creates a new order
   * 
   * @param data - The order data to submit
   * @returns Promise with the created order data and payment info if applicable
   */
  async createOrder(data: OrderFormData): Promise<any> {
    try {
      // Make sure we have all required fields
      if (!data.blane_id || !data.name || !data.email || !data.phone || !data.payment_method) {
        throw new Error('Missing required fields for order creation');
      }
      
      // Check numeric values
      if (data.quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      if (data.total_price <= 0) {
        throw new Error('Total price must be greater than 0');
      }
      
      // If payment method is partiel, ensure partiel_price is provided
      if (data.payment_method === 'partiel' && (data.partiel_price === undefined || data.partiel_price === null)) {
        throw new Error('Partial payment amount is required for partial payment method');
      }
      
      const response = await GuestApiClient.post(
        FRONT_ORDERS_ENDPOINTS.createOrder(),
        data
      );
      
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Updates the status of an order
   * 
   * @param orderNumber - The order number to update
   * @param data - The status data to update
   * @returns Promise with the updated order data
   */
  async updateOrderStatus(orderNumber: string, data: { status: string }): Promise<OrderType> {
    try {
      const response = await GuestApiClient.patch<{ data: OrderType }>(
        FRONT_ORDERS_ENDPOINTS.updateOrderStatus(orderNumber),
        data
      );
      return response.data.data;
    } catch (error) {
      console.error(`Error updating status for order ${orderNumber}:`, error);
      throw error;
    }
  },

  /**
   * Cancels an order using the cancellation token and data
   * 
   * @param orderNumber - The order number or ID
   * @param token - The cancellation token provided by the API
   * @param timestamp - The timestamp associated with the cancellation token
   * @returns Promise with cancellation result
   */
  async cancelOrder(orderNumber: string, token: string, timestamp: string): Promise<CancellationResponse> {
    try {
      const response = await GuestApiClient.post<CancellationResponse>(
        FRONT_ORDERS_ENDPOINTS.cancelOrder(),
        {
          id: orderNumber,
          token,
          timestamp
        }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error canceling order ${orderNumber}:`, error);
      throw error;
    }
  },
};
