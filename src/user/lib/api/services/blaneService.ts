import axios from 'axios';
import FRONT_BLANE_ENDPOINTS from '../endpoints/blane';
import { Blane, BlaneImage } from '../../types/home';
import { GuestApiClient, withRetry, DEFAULT_RETRY_CONFIG } from '../client';

const API_BASE_URL = 'https://dev.dabablane.com/api';
const BLANES_BY_VENDOR_TOKEN = '341|VpVP0S40nL6kbe6IjyTJqSuaZ7fbMAGjw1DWG2ePa10f40ff';

export interface BlaneResponse {
  success?: boolean;
  data: Blane;
  message?: string;
}

export interface BlanesResponse {
  success?: boolean;
  data: Blane[];
  message?: string;
}

export interface BlaneQueryParams {
  include?: string; // comma-separated: 'blaneImages,subcategory,category,ratings'
  sort_by?: 'created_at' | 'name' | 'price_current' | 'ratings';
  sort_order?: 'asc' | 'desc';
  search?: string;
  status?: string;
  city?: string;
  category?: string | number;
  subcategory?: string | number;
  type?: string;
  ratings?: number; // between 1 and 5
  pagination_size?:number;
  page?: string;
  token?: string; // for shared link access
}

export interface BlanesByVendorParams {
  commerce_name: string;
  paginationSize?: number;
  page?: number;
  include?: string;
}

export interface BlaneImagesResponse {
  success?: boolean;
  data: BlaneImage[];
  message?: string;
}

export class BlaneService {
  /**
   * Normalizes blane data to ensure images are consistently structured
   * Different API endpoints might return different data structures
   */
  static normalizeBlaneData(blane: any): Blane {
    // Create a normalized blane with consistent image structure
    const normalizedBlane = {
      ...blane,
      // Ensure images array exists
      images: blane.images || [],
      // Ensure blane_images are properly structured
      blane_images: Array.isArray(blane.blane_images) 
        ? blane.blane_images 
        : Array.isArray(blane.blaneImages) 
          ? blane.blaneImages.map((img: any) => ({ image_link: img }))
          : []
    };
    
    // If we have image_link as direct properties in a blaneImages array, normalize them
    if (Array.isArray(blane.blaneImages) && blane.blaneImages.length > 0) {
      normalizedBlane.blane_images = blane.blaneImages.map((img: any) => {
        // Handle different image formats from API
        if (typeof img === 'string') {
          return { image_link: img };
        } else if (img && typeof img === 'object') {
          if ('image_link' in img) {
            return img;
          } else if ('url' in img) {
            return { image_link: img.url };
          } else if ('path' in img) {
            return { image_link: img.path };
          }
        }
        return { image_link: '' };
      });
    }
    
    return normalizedBlane as Blane;
  }
  
  /**
   * Normalizes an array of blanes to ensure consistent image structure
   */
  static normalizeBlanesData(blanes: any[]): Blane[] {
    return blanes.map(blane => this.normalizeBlaneData(blane));
  }

  /**
   * Fetches all blanes using the GuestApiClient with retry capability
   */
  static async getAllBlanes(
    params?: BlaneQueryParams, 
    retryConfig?: {
      timeout?: number;
      maxRetries?: number;
      retryDelay?: number;
    }
  ): Promise<BlanesResponse> {
    try {
      // Ensure we're setting proper defaults for pagination and include blaneImages
      const queryParams = {
        ...params,
        pagination_size: params?.pagination_size || 10,
        page: params?.page || '1',
        include: params?.include || 'blaneImages' // Always include blaneImages by default
      };
      
      // Use withRetry to apply custom retry configuration for this request
      const response = await GuestApiClient.get(
        FRONT_BLANE_ENDPOINTS.getAllBlanes(),
        withRetry({ params: queryParams }, {
          timeout: retryConfig?.timeout || DEFAULT_RETRY_CONFIG.timeout,
          maxRetries: retryConfig?.maxRetries || DEFAULT_RETRY_CONFIG.maxRetries,
          retryDelay: retryConfig?.retryDelay || DEFAULT_RETRY_CONFIG.retryDelay
        })
      );
      
      // For APIs that return direct data without the success field
      if (response?.data?.data) {
        const normalizedData = this.normalizeBlanesData(response.data.data);
        return { data: normalizedData };
      }
      
      // For APIs that return the data directly at the top level
      if (Array.isArray(response?.data)) {
        const normalizedData = this.normalizeBlanesData(response.data);
        return { data: normalizedData };
      }
      
      // Ensure we have a valid response format
      if (!response || !response.data) {
        return { success: false, data: [], message: 'Invalid API response structure' };
      }
      
      // For other response formats, try to normalize if there's a data property
      if (response.data.data) {
        const normalizedData = Array.isArray(response.data.data) 
          ? this.normalizeBlanesData(response.data.data)
          : [this.normalizeBlaneData(response.data.data)];
        
        return { 
          ...response.data,
          data: normalizedData
        };
      }
      
      return response.data;
    } catch (error) {
      // Return a fallback response so the app doesn't crash
      return { 
        success: false, 
        data: [], 
        message: error instanceof Error ? error.message : 'Failed to fetch blanes' 
      };
    }
  }

  /**
   * Fetches a single blane by slug using the GuestApiClient with retry capability
   */
  static async getBlaneBySlug(
    slug: string, 
    params?: Pick<BlaneQueryParams, 'include' | 'token'>,
    retryConfig?: {
      timeout?: number;
      maxRetries?: number;
      retryDelay?: number;
    }
  ): Promise<BlaneResponse> {
    try {
      const endpoint = FRONT_BLANE_ENDPOINTS.getBlaneBySlug(slug);
      
      // Ensure blaneImages are included
      const queryParams = {
        ...params,
        include: params?.include || 'blaneImages' // Always include blaneImages by default
      };
      
      // Use withRetry to apply custom retry configuration for this request
      const response = await GuestApiClient.get(
        endpoint,
        withRetry({ params: queryParams }, {
          timeout: retryConfig?.timeout || 8000, // Increase timeout for detail pages
          maxRetries: retryConfig?.maxRetries || DEFAULT_RETRY_CONFIG.maxRetries,
          retryDelay: retryConfig?.retryDelay || DEFAULT_RETRY_CONFIG.retryDelay
        })
      );
      
      // Handle API response that doesn't have the expected structure
      if (response?.data) {
        // Case 1: Direct data object at the root level
        if (response.data.id && !response.data.data) {
          return { data: this.normalizeBlaneData(response.data) };
        }
        
        // Case 2: Nested data object
        if (response.data.data) {
          return {
            ...response.data,
            data: this.normalizeBlaneData(response.data.data)
          };
        }
        
        // Case 3: Unexpected response structure
        throw new Error(`Invalid response format from API for slug: ${slug}`);
      }
      
      throw new Error(`Empty response from API for slug: ${slug}`);
    } catch (error) {
      if (error instanceof Error) {
        // Enhance error message with endpoint info
        const message = `Failed to fetch blane with slug: ${slug} - ${error.message}`;
        const enhancedError = new Error(message);
        throw enhancedError;
      }
      
      throw error;
    }
  }
  
  /**
   * Fetches blane images by blane ID
   */
  static async getBlaneImages(
    blaneId: number | string,
    retryConfig?: {
      timeout?: number;
      maxRetries?: number;
      retryDelay?: number;
    }
  ): Promise<BlaneImagesResponse> {
    try {
      const response = await GuestApiClient.get(
        FRONT_BLANE_ENDPOINTS.getBlaneImages(blaneId.toString()),
        withRetry({}, {
          timeout: retryConfig?.timeout || DEFAULT_RETRY_CONFIG.timeout,
          maxRetries: retryConfig?.maxRetries || DEFAULT_RETRY_CONFIG.maxRetries,
          retryDelay: retryConfig?.retryDelay || DEFAULT_RETRY_CONFIG.retryDelay
        })
      );
      
      // Handle different response formats
      if (response?.data?.data) {
        return response.data;
      }
      
      if (Array.isArray(response?.data)) {
        return { data: response.data };
      }
      
      return response.data;
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error(`Failed to fetch images for blane with id: ${blaneId}`);
    }
  }

  /**
   * Fetches blanes by vendor commerce name using a dedicated back-office endpoint
   */
  static async getBlanesByVendor(
    params: BlanesByVendorParams,
  ): Promise<BlanesResponse> {
    try {
      const queryParams = {
        commerce_name: params.commerce_name,
        paginationSize: params.paginationSize ?? 100,
        page: params.page ?? 1,
        include: params.include ?? 'blaneImages',
      };

      const response = await axios.get(`${API_BASE_URL}/back/v1/getBlanesByVendor`, {
        params: queryParams,
        headers: {
          Authorization: `Bearer ${BLANES_BY_VENDOR_TOKEN}`,
          Accept: 'application/json',
        },
      });

      const payload = response.data ?? {};
      const rawData = Array.isArray(payload?.data?.data)
        ? payload.data.data
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
      const normalizedData = this.normalizeBlanesData(rawData);

      return {
        data: normalizedData,
        success: true,
        message: payload?.message,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to fetch blanes by vendor',
      };
    }
  }
}
