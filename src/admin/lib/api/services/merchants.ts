import { adminApiClient as apiClient } from '../client';
import BACK_MERCHANTS_ENDPOINTS from '../endpoints/merchants';
import { Merchant, MerchantFormData } from '../types/merchants';
import { ApiResponse } from '../types/api';

export const merchantApi = {
  async getMerchants() {
    const response = await apiClient.get<ApiResponse<Merchant[]>>(
      BACK_MERCHANTS_ENDPOINTS.getAllMerchants()
    );
    return response.data.data;
  },

  async getMerchant(id: string) {
    const response = await apiClient.get<ApiResponse<Merchant>>(
      BACK_MERCHANTS_ENDPOINTS.getMerchantById(id)
    );
    return response.data.data;
  },

  async createMerchant(data: MerchantFormData) {
    const response = await apiClient.post<ApiResponse<Merchant>>(
      BACK_MERCHANTS_ENDPOINTS.createMerchant(),
      data
    );
    return response.data.data;
  },

  async updateMerchant(id: string, data: MerchantFormData) {
    const response = await apiClient.put<ApiResponse<Merchant>>(
      BACK_MERCHANTS_ENDPOINTS.updateMerchant(id),
      data
    );
    return response.data.data;
  },

  async deleteMerchant(id: string) {
    await apiClient.delete<ApiResponse<void>>(
      BACK_MERCHANTS_ENDPOINTS.deleteMerchant(id)
    );
  }
};