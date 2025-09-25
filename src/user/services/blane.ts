import { BlaneService as ApiBlaneService } from '@/user/lib/api/services/blaneService';

/**
 * Blane service for user-facing operations
 */
export const blaneService = {
  /**
   * Get a blane by its ID
   */
  async getBlaneById(id: string | number) {
    try {
      const response = await ApiBlaneService.getBlaneBySlug(`${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get an order by its ID
   */
  async getOrderById(id: string) {
    try {
      const response = await fetch(`/api/orders/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch order with ID ${id}`);
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}; 