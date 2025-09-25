import { adminApiClient as apiClient } from '../client';
import BACK_CITY_ENDPOINTS from '../endpoints/cities';
import { CityType, CitiesResponse, CitiesFormData } from '../types/cities';
import { ApiResponse } from '../types/api';
import { City } from '../types/city';

interface GetCitiesParams {
  page?: number;
  paginationSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  categoryId?: string;
}

export const cityApi = {
  async getCities(params: GetCitiesParams = {}) {
    try {
      const apiParams = {
        page: params.page,
        pagination_size: params.paginationSize,
        sort_by: params.sortBy,
        sort_order: params.sortOrder,
        search: params.search,
        category_id: params.categoryId,
      };

      const response = await apiClient.get<CitiesResponse>(
        BACK_CITY_ENDPOINTS.getAllCities(),
        { params: apiParams }
      );

      if (!response.data || !response.data.data || !response.data.meta) {
        throw new Error('Invalid API response structure');
      }

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch cities: ${error?.message || 'Unknown error'}`);
    }
  },

  async getCity(id: string) {
    try {
      const response = await apiClient.get<ApiResponse<CityType>>(
        BACK_CITY_ENDPOINTS.getCityById(id)
      );
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  async createCity(data: CitiesFormData) {
    try {
      const response = await apiClient.post<ApiResponse<CityType>>(
        BACK_CITY_ENDPOINTS.createCity(),
        data
      );
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  async updateCity(id: string, data: CitiesFormData) {
    try {
      const response = await apiClient.put<ApiResponse<CityType>>(
        BACK_CITY_ENDPOINTS.updateCity(id),
        data
      );
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  // async updateStatusCity(id: string, data: { status: boolean }) {
  //   try {
  //     const response = await apiClient.put<ApiResponse<City>>(
  //       BACK_CITY_ENDPOINTS.updateStatusCity(id),
  //       data
  //     );
  //     return response.data.data;
  //   } catch (error) {
  //     throw error;
  //   }
  // },

  async deleteCity(id: string) {
    try {
      await apiClient.delete<ApiResponse<void>>(
        BACK_CITY_ENDPOINTS.deleteCity(id)
      );
    } catch (error: any) {
      throw error;
    }
  },
};