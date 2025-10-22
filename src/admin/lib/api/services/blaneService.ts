import { adminApiClient as apiClient } from '../client';
import BACK_BLANE_ENDPOINTS from '../endpoints/blane';
import { BLANE_VISIBILITY_ENDPOINTS } from "../endpoints/blaneVisibility";
import { ApiResponse } from '../types/api';
import { Blane, BlaneResponse, BlaneFormData } from '../types/blane';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { type BlaneStatus } from '../constants/status';

export const blaneApi = {
  async getBlanes({
    page = 1,
    paginationSize = 10,
    include = 'blaneImages',
    sortBy = null,
    sortOrder = null,
    search = null,
    categories_id = null,
    subcategories_id = null,
  }: {
    page?: number;
    paginationSize?: number;
    sortBy?: string | null;
    sortOrder?: string | null;
    search?: string | null;
    categories_id?: string | null;
    subcategories_id?: string | null;
  } = {}): Promise<BlaneResponse> {
    try {
      const params: Record<string, string | number> = {
        page,
        paginationSize,
        include,
      };

      if (sortBy) params.sort_by = sortBy;
      if (sortOrder) params.sort_order = sortOrder;
      if (search) params.search = search;
      if (categories_id) params.categories_id = categories_id;
      if (subcategories_id) params.subcategories_id = subcategories_id;
      

      const response = await apiClient.get<BlaneResponse>(
        BACK_BLANE_ENDPOINTS.getAllBlanes(),
        { params }
      );
      return response.data;
    } catch (error) {
      toast.error('Failed to fetch blanes. Please try again later.');
      throw error;
    }
  },

  async getBlane(id: string, include = 'blaneImages'): Promise<Blane> {
    try {
      const response = await apiClient.get<ApiResponse<Blane>>(
        BACK_BLANE_ENDPOINTS.getBlaneById(id),{params:{include}}
      );
      return response.data.data;
    } catch (error) {
      toast.error('Failed to fetch blane. Please try again later.');
      throw error;
    }
  },

  async createBlane(formData: FormData): Promise<Blane> {
    try {
      const response = await apiClient.post<ApiResponse<Blane>>(
        BACK_BLANE_ENDPOINTS.createBlane(),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      toast.success('Blane created successfully!');
      return response.data.data;
    } catch (error) {
      toast.error('Failed to create blane. Please try again later.');
      throw error;
    }
  },

  async updateBlane(id: string, data: BlaneFormData): Promise<Blane> {
    try {
      const response = await apiClient.put<ApiResponse<Blane>>(
        BACK_BLANE_ENDPOINTS.updateBlane(id),
        data
      );
      toast.success('Blane updated successfully!');
      return response.data.data;
    } catch (error) {
      toast.error('Failed to update blane. Please try again later.');
      throw error;
    }
  },

  async updateStatusBlane(id: string, data: { status: BlaneStatus }): Promise<Blane> {
    try {
      const response = await apiClient.patch<ApiResponse<Blane>>(
        BACK_BLANE_ENDPOINTS.updateStatusBlane(id),
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteBlane(id: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<void>>(
        BACK_BLANE_ENDPOINTS.deleteBlane(id)
      );
      toast.success('Blane deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete blane. Please try again later.');
      throw error;
    }
  },

  async fetchIcons(query: string): Promise<string[]> {
    try {
      const response = await axios.get<{ icons: string[] }>(
        `https://api.iconify.design/search?query=${query}&limit=50`
      );
      if (!response.data || !response.data.icons) {
        throw new Error('Invalid API response structure');
      }
      return response.data.icons;
    } catch (error) {
      toast.error('Failed to fetch icons. Please try again later.');
      throw error;
    }
  },

  async updateBlaneFormData(id: string | number, formData: FormData): Promise<ApiResponse<Blane>> {
    try {
      const response = await apiClient.post(`${BACK_BLANE_ENDPOINTS.BASE}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-HTTP-Method-Override': 'PUT',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getBlaneType(type: string): Promise<unknown> {
    const response = await apiClient.get<ApiResponse<unknown>>(
      BACK_BLANE_ENDPOINTS.getBlaneType(type)
    );
    return response.data.data;
  },
  
  async getBlanesByType(type: string): Promise<ApiResponse<Blane[]>> {
    const response = await apiClient.get<ApiResponse<Blane[]>>(
      BACK_BLANE_ENDPOINTS.getBlaneType(type)
    );
    return response.data;
  },

  // Add bulk delete method
  async bulkDelete(ids: number[]): Promise<void> {
    try {
      await apiClient.post<ApiResponse<void>>(
        BACK_BLANE_ENDPOINTS.bulkDelete(),
        { ids }
      );
      toast.success('Selected blanes deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete selected blanes. Please try again later.');
      throw error;
    }
  },

  // Visibility API methods
  generateShareLink: async (id: string) => {
    const response = await apiClient.post(BLANE_VISIBILITY_ENDPOINTS.SHARE_LINK(id));
    return response;
  },

  revokeShareLink: async (id: string) => {
    const response = await apiClient.delete(BLANE_VISIBILITY_ENDPOINTS.SHARE_LINK(id));
    return response;
  },

  updateVisibility: async (id: string, visibility: string) => {
    const response = await apiClient.patch(BLANE_VISIBILITY_ENDPOINTS.VISIBILITY(id), { visibility });
    return response;
  },

  // Access shared blanes by slug and token
  getSharedBlane: async (slug: string, token: string) => {
    const response = await apiClient.get(BLANE_VISIBILITY_ENDPOINTS.SHARED(slug, token));
    return response;
  }
};
