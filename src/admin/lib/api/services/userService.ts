import { adminApiClient as apiClient } from '../client';
import BACK_USER_ENDPOINTS from '../endpoints/user';
import { UserResponse, UserFormData, UserFilters } from '../types/user';
import { AxiosResponse } from 'axios';

export const userApi = {
  async getUsers(filters: UserFilters = {}): Promise<UserResponse> {
    const params = {
      page: filters.page || 1,
      per_page: filters.paginationSize || 10,
      sort_by: filters.sortBy,
      sort_order: filters.sortOrder,
      search: filters.search,
      ...filters.filters,
    };

    const response: AxiosResponse<UserResponse> = await apiClient.get(
      BACK_USER_ENDPOINTS.getAllUsers(),
      { params }
    );
    return response.data;
  },

  async getUserById(id: string) {
    const response = await apiClient.get(BACK_USER_ENDPOINTS.getUserById(id));
    return response.data;
  },

  async createUser(userData: UserFormData) {
    const response = await apiClient.post(BACK_USER_ENDPOINTS.createUser(), userData);
    return response.data;
  },

  async updateUser(id: string, userData: Partial<UserFormData>) {
    try {
      const response = await apiClient.put(
        BACK_USER_ENDPOINTS.updateUser(id), 
        userData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async deleteUser(id: string) {
    const response = await apiClient.delete(BACK_USER_ENDPOINTS.deleteUser(id));
    return response.data;
  },

  async assignRole(userId: string, roles: string[]) {
    const response = await apiClient.post(BACK_USER_ENDPOINTS.assignUserRole(userId), {
      roles
    });
    return response.data;
  },

  async exportUsers(filters: UserFilters = {}): Promise<Blob> {
    const params = {
      ...filters,
      page: filters.page || 1,
      per_page: filters.paginationSize || 10,
      sort_by: filters.sortBy,
      sort_order: filters.sortOrder,
      search: filters.search,
    };

    const response = await apiClient.get(BACK_USER_ENDPOINTS.exportUsers(), {
      params,
      responseType: 'blob',
    });
    return response.data;
  }
};
