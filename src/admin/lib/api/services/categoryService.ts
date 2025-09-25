import { adminApiClient as apiClient } from '../client';
import BACK_CATEGORY_ENDPOINTS from '../endpoints/category';
import { Category, CategoryResponse, CategoryFormData } from '../types/category';
import { ApiResponse } from '../types/api';
import axios from 'axios';

export const categoryApi = {
  async getCategories({
    page = 1,
    paginationSize = 10, // Default to 10 items per page
    sortBy = null,
    sortOrder = null,
    search = null,
  } = {}) {
    try {
      const params: Record<string, any> = {
        page,
        paginationSize,
      };
  
      // Add optional parameters if provided
      if (sortBy) params.sort_by = sortBy;
      if (sortOrder) params.sort_order = sortOrder;
      if (search) params.search = search;
  
  
      const response = await apiClient.get<CategoryResponse>(
        BACK_CATEGORY_ENDPOINTS.getAllCategories(),
        { params }
      );
  
  
      // Ensure the response has the expected structure
      if (!response.data || !response.data.data || !response.data.meta) {
        throw new Error('Invalid API response structure');
      }
  
      return response.data;
    } catch (error) {
  
      // Rethrow the error with a custom message
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  },
  async getCategory(id: string) {
    try {
      const response = await apiClient.get<ApiResponse<Category>>(
        BACK_CATEGORY_ENDPOINTS.getCategoryById(id)
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async createCategory(data: CategoryFormData) {
    try {
      const response = await apiClient.post<ApiResponse<Category>>(
        BACK_CATEGORY_ENDPOINTS.createCategory(),
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Set the correct content type for file upload
          },
        }
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async updateCategory(id: string, data: FormData) {
    try {
      // Use FormData-compatible request
      const response = await apiClient.post<ApiResponse<Category>>(
        `${BACK_CATEGORY_ENDPOINTS.updateCategory(id)}?_method=PUT`, // Use POST with _method=PUT for Laravel
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async updateStatusCategory(id: string, status: string) {
    try {
      const response = await apiClient.put<ApiResponse<Category>>(
        BACK_CATEGORY_ENDPOINTS.updateStatusCategory(id),
        { status }
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteCategory(id: string) {
    try {
      await apiClient.delete<ApiResponse<void>>(
        BACK_CATEGORY_ENDPOINTS.deleteCategory(id)
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