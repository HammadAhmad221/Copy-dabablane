import { adminApiClient as apiClient } from '../client';
import BACK_CONTACT_ENDPOINTS from '../endpoints/contact';
import { Contact, ContactFormData, ContactResponse } from '../types/contact';
import { ApiResponse } from '../types/api';

interface GetContactsParams {
  page?: number;
  paginationSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  status?: string;
}

export const contactApi = {
  async getContacts(params: GetContactsParams = {}) {
    try {
      const response = await apiClient.get<ContactResponse>(
        BACK_CONTACT_ENDPOINTS.GetAll(),
        {
          params: {
            page: params.page,
            pagination_size: params.paginationSize,
            sort_by: params.sortBy,
            sort_order: params.sortOrder,
            search: params.search,
            status: params.status,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getContact(id: string) {
    try {
      const response = await apiClient.get<{ data: Contact }>(
        BACK_CONTACT_ENDPOINTS.Get(id)
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async createContact(data: ContactFormData) {
    try {
      const response = await apiClient.post<ApiResponse<ContactFormData>>(
        BACK_CONTACT_ENDPOINTS.GetAll(),
        data
      );
      return response.data.data;
    } catch (error: any) {
      throw error;
    }
  },

  async updateContact(id: string, data: ContactFormData) {
    try {
      const response = await apiClient.put<{ data: Contact }>(
        BACK_CONTACT_ENDPOINTS.Update(id),
        data
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteContact(id: string) {
    try {
      await apiClient.delete(BACK_CONTACT_ENDPOINTS.Delete(id));
    } catch (error) {
      throw error;
    }
  },
};