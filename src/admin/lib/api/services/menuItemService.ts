import { adminApiClient as apiClient } from '../client';
import BACK_MENU_ITEMS_ENDPOINTS from '../endpoints/menuItems';
import { MenuItem, MenuItemFormData, MenuItemResponse } from '../types/menuItems';
import { ApiResponse } from '../types/api';
import axios from 'axios';

interface GetMenuItemsParams {
  page?: number;
  paginationSize?: number;
  sort_by?: 'created_at' | 'label' | 'position';
  sort_order?: 'asc' | 'desc';
  search?: string;
  is_active?: boolean;
}

export const menuItemApi = {
  async getMenuItems({
    page = 1,
    paginationSize = 10,
    sort_by = 'created_at',
    sort_order = 'desc',
    search = undefined,
    is_active = undefined,
  }: GetMenuItemsParams = {}) {
    try {
      const params: Record<string, any> = {
        page,
        paginationSize,
      };

      if (sort_by) params.sort_by = sort_by;
      if (sort_order) params.sort_order = sort_order;
      if (search) params.search = search;
      if (typeof is_active !== 'undefined') params.is_active = is_active;

      const response = await apiClient.get<Promise<MenuItemResponse>>(
        BACK_MENU_ITEMS_ENDPOINTS.getAllMenuItems(),
        { params }
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getMenuItem(id: string) {
    try {
      const response = await apiClient.get<ApiResponse<MenuItem>>(
        BACK_MENU_ITEMS_ENDPOINTS.getMenuItemById(id)
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async createMenuItem(data: MenuItemFormData) {
    try {
      const response = await apiClient.post<ApiResponse<MenuItem>>(
        BACK_MENU_ITEMS_ENDPOINTS.createMenuItem(),
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async updateMenuItem(id: string, data: MenuItemFormData) {
    try {
      const response = await apiClient.put<ApiResponse<MenuItem>>(
        BACK_MENU_ITEMS_ENDPOINTS.updateMenuItem(id),
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteMenuItem(id: string) {
    try {
      await apiClient.delete<ApiResponse<void>>(
        BACK_MENU_ITEMS_ENDPOINTS.deleteMenuItem(id)
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

export default menuItemApi;