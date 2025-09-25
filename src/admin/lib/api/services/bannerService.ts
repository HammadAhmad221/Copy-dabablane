import { adminApiClient as apiClient } from '../client';
import BACK_BANNER_ENDPOINTS from '../endpoints/Banner';
import { BannerResponse, BannerFormData, BannerType } from '../types/banner';
import { ApiResponse } from '../types/api';
import axios from 'axios';

interface GetBannersParams {
  page?: number;
  paginationSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export const bannerApi = {
  async getBanners(): Promise<{ data: BannerType }> {
    try {
      const response = await apiClient.get<{ data: BannerType }>(
        BACK_BANNER_ENDPOINTS.BASE
      );
      
      // Check if response has data
      if (!response.data) {
        throw new Error('Invalid API response structure');
      }
      
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch banners');
    }
  },

  async createBanner(data: BannerFormData) {
    try {
      const response = await apiClient.post<ApiResponse<BannerType>>(
        BACK_BANNER_ENDPOINTS.createBanner(),
        data
      );
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  async updateBanner(formData: FormData) {
    try {
      const response = await apiClient.post<ApiResponse<BannerType>>(
        BACK_BANNER_ENDPOINTS.updateBanner(), // Ensure this endpoint is correct
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-HTTP-Method-Override': 'PUT'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to update banner: ${error.response?.data?.message || error.message}`);
    }
  },

  async deleteBanner(id: string) {
    try {
      await apiClient.delete<ApiResponse<void>>(
        BACK_BANNER_ENDPOINTS.deleteBanner(id)
      );
    } catch (error: any) {
      throw error;
    }
  },
};

export default bannerApi;