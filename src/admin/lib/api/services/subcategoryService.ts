import { adminApiClient as apiClient } from '../client';
import BACK_SUBCATEGORY_ENDPOINTS from '../endpoints/subcategory';
import { Subcategory, SubcategoryFormData, SubcategoryResponse } from '../types/subcategory';
import { ApiResponse } from '../types/api';
import axios from 'axios';

export const subcategoryApi = {
  async getSubcategories({
    page = 1,
    paginationSize = 10,
    sortBy = null,
    sortOrder = null,
    search = null,
    categoryId = null,
  } = {}) {
    try {
      const params: Record<string, any> = {
        page,
        paginationSize,
      };

      if (sortBy) params.sort_by = sortBy;
      if (sortOrder) params.sort_order = sortOrder;
      if (search) params.search = search;
      if (categoryId) params.category_id = categoryId;

      const response = await apiClient.get<Promise<SubcategoryResponse>>(
        BACK_SUBCATEGORY_ENDPOINTS.getAllSubcategories(),
        { params }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getSubcategory(id: string) {
    try {
      const response = await apiClient.get<ApiResponse<Subcategory>>(
        BACK_SUBCATEGORY_ENDPOINTS.getSubcategoryById(id)
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async createSubcategory(data: SubcategoryFormData) {
    try {
      const response = await apiClient.post<ApiResponse<Subcategory>>(
        BACK_SUBCATEGORY_ENDPOINTS.createSubcategory(),
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async updateSubcategory(id: string, data: SubcategoryFormData) {
    try {
      const response = await apiClient.put<ApiResponse<Subcategory>>(
        BACK_SUBCATEGORY_ENDPOINTS.updateSubcategory(id),
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async updateStatusSubcategory(id: string, status: string) {
    try {
      const response = await apiClient.put<ApiResponse<Subcategory>>(
        BACK_SUBCATEGORY_ENDPOINTS.updateSubcategory(id),
        { status }
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteSubcategory(id: string) {
    try {
      await apiClient.delete<ApiResponse<void>>(
        BACK_SUBCATEGORY_ENDPOINTS.deleteSubcategory(id)
      );
    } catch (error) {
      throw error;
    }
  },

  async fetchIcons(query: string) {
    try {
      const response = await axios.get(`https://api.iconify.design/search?query=${query}&limit=50`);
      if (!response.data || !response.data.icons) {
        throw new Error('Invalid API response structure');
      }
      return response.data.icons;
    } catch (error) {
      throw error;
    }
  },
};

export default subcategoryApi;
