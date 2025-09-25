import FRONT_HOME_ENDPOINTS from '../endpoints/home';
import { HomeResponse } from '../../types/home';
import { GuestApiClient, withRetry, DEFAULT_RETRY_CONFIG } from '../client';

export class HomeService {
  /**
   * Fetches home data using the GuestApiClient with retry capability
   */
  static async getHomeData(retryConfig?: {
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
  }): Promise<HomeResponse> {
    try {
      // Use withRetry to apply custom retry configuration for this request
      const config = withRetry({}, {
        timeout: retryConfig?.timeout || DEFAULT_RETRY_CONFIG.timeout,
        maxRetries: retryConfig?.maxRetries || DEFAULT_RETRY_CONFIG.maxRetries,
        retryDelay: retryConfig?.retryDelay || DEFAULT_RETRY_CONFIG.retryDelay
      });
      
      const response = await GuestApiClient.get(
        FRONT_HOME_ENDPOINTS.getHomeData(),
        config
      );
      
      return response.data;
    } catch (error) {
      console.error('Home data fetch error:', error);
      // The error handling is now done in the client, just rethrow with clearer context
      throw error instanceof Error 
        ? error 
        : new Error('Failed to fetch home data');
    }
  }
}
